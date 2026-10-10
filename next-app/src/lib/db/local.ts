/**
 * JSON-file backed implementation of `Database`.
 *
 * Used whenever Firebase credentials are missing so that every backend feature
 * (orders, menu, coupons, settings, users, archives) runs without external
 * services. Writes are serialised and land atomically via a temp-file rename.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  matchesFilter,
  sortDocs,
  type Collection,
  type Database,
  type Doc,
  type Page,
  type QuerySpec,
} from '@/lib/db/types';

interface LocalShape {
  [collection: string]: Record<string, Doc>;
}

import fs from 'node:fs';

function getDataFile(): string {
  const repoRootNested = path.join(process.cwd(), 'next-app', '.data', 'pm-zaika.json');
  if (fs.existsSync(repoRootNested)) {
    return repoRootNested;
  }
  return path.join(process.cwd(), '.data', 'pm-zaika.json');
}

let cache: LocalShape | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<LocalShape> {
  if (cache) return cache;
  const targetFile = getDataFile();
  try {
    cache = JSON.parse(await readFile(targetFile, 'utf8')) as LocalShape;
  } catch {
    cache = {};
  }
  return cache;
}

async function persist(db: LocalShape): Promise<void> {
  const targetFile = getDataFile();
  const dir = path.dirname(targetFile);
  await mkdir(dir, { recursive: true });
  await writeFile(targetFile, JSON.stringify(db, null, 2), 'utf8');

  // Also keep root .data and next-app .data in sync if possible
  try {
    const isInsideNextApp = targetFile.includes(path.join('next-app', '.data'));
    const altFile = isInsideNextApp
      ? path.join(process.cwd(), '.data', 'pm-zaika.json')
      : path.join(process.cwd(), 'next-app', '.data', 'pm-zaika.json');
    if (fs.existsSync(path.dirname(altFile))) {
      await writeFile(altFile, JSON.stringify(db, null, 2), 'utf8');
    }
  } catch {
    // best-effort sync
  }
}

function withLock<T>(fn: (db: LocalShape) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function selectAll(docs: Doc[], spec: QuerySpec = {}): Doc[] {
  const filtered = (spec.filters ?? []).reduce(
    (acc, filter) => acc.filter((doc) => matchesFilter(doc, filter)),
    docs
  );
  return sortDocs(filtered, spec.orderBy);
}

function createCollection<T extends Doc>(name: string): Collection<T> {
  /** Always called with the locked snapshot, never cached across operations. */
  const bucket = (db: LocalShape): Record<string, Doc> => (db[name] ??= {});

  return {
    async get(id) {
      return withLock((store) => (bucket(store)[id] as T) ?? null);
    },

    async findOne(field, value) {
      return withLock((store) => {
        const match = Object.values(bucket(store)).find(
          (doc) => matchesFilter(doc, { field, op: '==', value })
        );
        return (match as T) ?? null;
      });
    },

    async list(spec) {
      return withLock((store): Page<T> => {
        const all = selectAll(Object.values(bucket(store)), spec);
        const offset = spec?.offset ?? 0;
        const limit = spec?.limit;
        const page = limit === undefined ? all.slice(offset) : all.slice(offset, offset + limit);
        return { docs: page as T[], total: all.length };
      });
    },

    async count(spec) {
      return withLock(
        (store) => selectAll(Object.values(bucket(store)), spec).length
      );
    },

    async set(id, doc) {
      return withLock((store) => {
        const stored = { ...doc, id } as Doc;
        bucket(store)[id] = stored;
        return stored as T;
      });
    },

    async update(id, updater) {
      return withLock((store) => {
        const current = bucket(store)[id];
        if (!current) return null;
        const next = updater(structuredClone(current) as T);
        if (!next) return null;
        const stored = { ...next, id } as Doc;
        bucket(store)[id] = stored;
        return stored as T;
      });
    },

    async delete(id) {
      await withLock((store) => {
        delete bucket(store)[id];
      });
    },
  };
}

export const localDatabase: Database = {
  mode: 'local',
  collection<T extends Doc>(name: string) {
    return createCollection<T>(name);
  },
};

export function resetLocalDatabaseCache(): void {
  cache = null;
}