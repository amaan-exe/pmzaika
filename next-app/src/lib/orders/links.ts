import { SITE_URL } from '@/lib/env';
import type { Order } from '@/lib/domain/types';

/** Public tracking link handed to the customer (carries their secret token). */
export function orderTrackingUrl(order: Pick<Order, 'orderId' | 'trackingToken'>): string {
  const base = SITE_URL.replace(/\/$/, '');
  return `${base}/track/${order.orderId}?token=${order.trackingToken}`;
}

/** Admin dashboard deep link for a given order. */
export function adminOrderUrl(orderId: string): string {
  return `${SITE_URL.replace(/\/$/, '')}/admin/orders?order=${orderId}`;
}