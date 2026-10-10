import { COLLECTIONS, getDb } from '@/lib/db';
import type { Order } from '@/lib/domain/types';

/**
 * Terminal orders (delivered, served or cancelled) move to `orders_archive` so the
 * live kitchen queue stays small while history remains fully queryable.
 */
export const ARCHIVED_STATUSES = ['delivered', 'served', 'cancelled'] as const;

export async function archiveOrder(order: Order): Promise<boolean> {
  if (!ARCHIVED_STATUSES.includes(order.status as (typeof ARCHIVED_STATUSES)[number])) {
    return false;
  }

  const db = await getDb();

  await db.collection<Order>(COLLECTIONS.orderArchive).set(order.id, {
    ...order,
    archivedAt: new Date().toISOString(),
  });

  await db.collection<Order>(COLLECTIONS.orders).delete(order.id);

  return true;
}

/** Archives every terminal order still sitting in the active collection. */
export async function archiveCompletedOrders(): Promise<number> {
  const db = await getDb();
  const { docs } = await db.collection<Order>(COLLECTIONS.orders).list();

  let archived = 0;
  for (const order of docs) {
    if (await archiveOrder(order)) archived += 1;
  }
  return archived;
}