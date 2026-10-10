import { persistenceMode, type PersistenceMode } from '@/lib/env';
import type { Database } from '@/lib/db/types';

let database: Database | null = null;

/**
 * Returns the active database driver.
 *
 * `firebase-admin` is imported lazily so it is only loaded when Firestore is
 * genuinely in use, keeping local dev and cold starts fast.
 */
export async function getDb(): Promise<Database> {
  if (!database) {
    if (persistenceMode() === 'firestore') {
      const { firestoreDatabase } = await import('@/lib/db/firestore');
      database = firestoreDatabase;
    } else {
      const { localDatabase } = await import('@/lib/db/local');
      database = localDatabase;
    }
  }
  return database;
}

export function activeMode(): PersistenceMode {
  return persistenceMode();
}

/** Named collections, so a typo fails loudly instead of silently creating one. */
export const COLLECTIONS = {
  orders: 'orders',
  orderArchive: 'orders_archive',
  carts: 'carts',
  menu: 'menu',
  coupons: 'coupons',
  settings: 'settings',
  users: 'users',
  adminRoles: 'admin_roles',
  pushSubscriptions: 'admin_notification_subscriptions',
  webhookLogs: 'webhook_logs',
  couponsArchive: 'coupons_archive',
  reservations: 'reservations',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export * from '@/lib/db/types';