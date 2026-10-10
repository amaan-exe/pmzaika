import type { Query as FirestoreQuery } from 'firebase-admin/firestore';

import { adminDb } from '@/lib/firebase/admin';
import type {
  Collection,
  Database,
  Doc,
  Page,
  QuerySpec,
} from '@/lib/db/types';

/** Firestore rejects `undefined`; a round-trip strips those keys. */
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hydrate<T extends Doc>(id: string, data: Record<string, unknown>): T {
  return { ...(data as T), id };
}

const FIRESTORE_OPS = {
  '==': '==',
  '!=': '!=',
  in: 'in',
  'not-in': 'not-in',
  '>=': '>=',
  '>': '>',
  '<=': '<=',
  '<': '<',
  'array-contains': 'array-contains',
} as const;

/**
 * Builds the Firestore query for a spec.
 *
 * The bundled client only accepts one filter per `where()` call, so filters are
 * applied as a chain rather than a constraint array.
 */
function buildQuery(name: string, spec: QuerySpec = {}): FirestoreQuery {
  let query: FirestoreQuery = adminDb().collection(name);

  for (const filter of spec.filters ?? []) {
    query = query.where(
      filter.field,
      FIRESTORE_OPS[filter.op],
      filter.value
    );
  }

  for (const clause of spec.orderBy ?? []) {
    query = query.orderBy(clause.field, clause.direction);
  }

  if (spec.offset !== undefined) query = query.offset(spec.offset);
  if (spec.limit !== undefined) query = query.limit(spec.limit);

  return query;
}

function isQuotaExhausted(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota exceeded') ||
    msg.includes('exceeded its quota') ||
    (err as { code?: number })?.code === 8
  );
}

function createCollection<T extends Doc>(name: string): Collection<T> {
  const db = () => adminDb();

  return {
    async get(id) {
      try {
        const snap = await db().collection(name).doc(id).get();
        return snap.exists ? hydrate<T>(snap.id, snap.data() ?? {}) : null;
      } catch (err) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] get(${name}/${id}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).get(id);
        }
        throw err;
      }
    },

    async findOne(field, value) {
      try {
        const snap = await db()
          .collection(name)
          .where(field, '==', value)
          .limit(1)
          .get();
        if (snap.empty) return null;
        const doc = snap.docs[0]!;
        return hydrate<T>(doc.id, doc.data() ?? {});
      } catch (err) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] findOne(${name}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).findOne(field, value);
        }
        throw err;
      }
    },

    async list(spec = {}): Promise<Page<T>> {
      try {
        const query = buildQuery(name, spec);

        if (spec.limit === undefined && spec.offset === undefined) {
          const snap = await query.get();
          return { docs: snap.docs.map((d) => hydrate<T>(d.id, d.data() ?? {})), total: snap.size };
        }

        // A count aggregate is cheaper than downloading the whole collection just
        // to work out the total for pagination.
        const [snap, countSnap] = await Promise.all([
          query.get(),
          buildQuery(name, { filters: spec.filters }).count().get(),
        ]);

        return {
          docs: snap.docs.map((d) => hydrate<T>(d.id, d.data() ?? {})),
          total: countSnap.data().count,
        };
      } catch (err: unknown) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] list(${name}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).list(spec);
        }

        const message = err instanceof Error ? err.message : String(err);
        // If Firestore lacks a composite index for where() + orderBy(), fallback to querying
        // with filters only and sorting in memory.
        if (
          spec.orderBy &&
          spec.orderBy.length > 0 &&
          (message.includes('requires an index') || message.includes('FAILED_PRECONDITION'))
        ) {
          const fallbackQuery = buildQuery(name, { ...spec, orderBy: undefined });
          const snap = await fallbackQuery.get();
          let docs = snap.docs.map((d) => hydrate<T>(d.id, d.data() ?? {}));

          for (const order of spec.orderBy) {
            docs.sort((a, b) => {
              const valA = (a as Record<string, unknown>)[order.field];
              const valB = (b as Record<string, unknown>)[order.field];
              if (valA === valB) return 0;
              const res = String(valA ?? '').localeCompare(String(valB ?? ''));
              return order.direction === 'desc' ? -res : res;
            });
          }

          if (spec.offset !== undefined || spec.limit !== undefined) {
            const offset = spec.offset ?? 0;
            const limit = spec.limit ?? docs.length;
            const total = docs.length;
            docs = docs.slice(offset, offset + limit);
            return { docs, total };
          }

          return { docs, total: snap.size };
        }
        throw err;
      }
    },

    async count(spec = {}) {
      try {
        const snap = await buildQuery(name, { filters: spec.filters }).count().get();
        return snap.data().count;
      } catch (err) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] count(${name}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).count(spec);
        }
        throw err;
      }
    },

    async set(id, doc) {
      try {
        await db().collection(name).doc(id).set(stripUndefined(doc));
        return { ...doc, id };
      } catch (err) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] set(${name}/${id}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).set(id, doc);
        }
        throw err;
      }
    },

    async update(id, updater) {
      try {
        const ref = db().collection(name).doc(id);

        return await db().runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists) return null;

          const next = updater(hydrate<T>(snap.id, snap.data() ?? {}));
          if (!next) return null;

          tx.set(ref, stripUndefined(next));
          return { ...next, id };
        });
      } catch (err) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] update(${name}/${id}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).update(id, updater);
        }
        throw err;
      }
    },

    async delete(id) {
      try {
        await db().collection(name).doc(id).delete();
      } catch (err) {
        if (isQuotaExhausted(err)) {
          console.warn(`[firestore quota failover] delete(${name}/${id}) using local db`);
          const { localDatabase } = await import('@/lib/db/local');
          return localDatabase.collection<T>(name).delete(id);
        }
        throw err;
      }
    },
  };
}

export const firestoreDatabase: Database = {
  mode: 'firestore',
  collection<T extends Doc>(name: string) {
    return createCollection<T>(name);
  },
};