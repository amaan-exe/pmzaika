import type { PersistenceMode } from '@/lib/env';

/**
 * Minimal document-store abstraction used across the whole backend.
 *
 * Firestore is the production driver; a JSON-file driver backs local development
 * so every feature (orders, menu, coupons, settings, users) can be exercised
 * without provisioning Firebase first.
 */

export type FilterOp =
  | '=='
  | '!='
  | 'in'
  | 'not-in'
  | '>='
  | '>'
  | '<='
  | '<'
  | 'array-contains';

export interface Filter {
  /** Dotted paths are supported (`customer.phone`, `refund.status`). */
  field: string;
  op: FilterOp;
  value: unknown;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QuerySpec {
  filters?: Filter[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface Page<T> {
  docs: T[];
  total: number;
}

export interface Doc {
  id: string;
  [key: string]: unknown;
}

export interface Collection<T extends Doc> {
  get(id: string): Promise<T | null>;
  /** Convenience lookup for low-cardinality fields such as `couponCode`. */
  findOne(field: string, value: unknown): Promise<T | null>;
  list(spec?: QuerySpec): Promise<Page<T>>;
  count(spec?: QuerySpec): Promise<number>;
  set(id: string, doc: T): Promise<T>;
  /** Read-modify-write inside a transaction; return `null` to skip the write. */
  update(id: string, updater: (current: T) => T | null): Promise<T | null>;
  delete(id: string): Promise<void>;
}

export interface Database {
  mode: PersistenceMode;
  collection<T extends Doc>(name: string): Collection<T>;
}

/** Reads a (possibly dotted) field path from a plain object. */
export function readPath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      source
    );
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''));
}

/** In-memory filter evaluation, shared by the local driver and tests. */
export function matchesFilter(doc: Doc, filter: Filter): boolean {
  const actual = readPath(doc, filter.field);

  switch (filter.op) {
    case '==':
      return actual === filter.value;
    case '!=':
      return actual !== filter.value;
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(actual);
    case 'not-in':
      return Array.isArray(filter.value) && !filter.value.includes(actual);
    case '>=':
      return actual !== undefined && compare(actual, filter.value) >= 0;
    case '>':
      return actual !== undefined && compare(actual, filter.value) > 0;
    case '<=':
      return actual !== undefined && compare(actual, filter.value) <= 0;
    case '<':
      return actual !== undefined && compare(actual, filter.value) < 0;
    case 'array-contains':
      return Array.isArray(actual) && actual.includes(filter.value);
    default:
      return false;
  }
}

export function sortDocs(docs: Doc[], orderBy: OrderBy[] = []): Doc[] {
  if (orderBy.length === 0) return docs;

  return [...docs].sort((left, right) => {
    for (const clause of orderBy) {
      const a = readPath(left, clause.field);
      const b = readPath(right, clause.field);
      const result = compare(a ?? '', b ?? '');
      if (result !== 0) return clause.direction === 'desc' ? -result : result;
    }
    return 0;
  });
}