import webpush from 'web-push';

import { COLLECTIONS, getDb } from '@/lib/db';
import type { PushSubscription } from '@/lib/domain/types';

function vapidDetails() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:kitchen@pmzaika.local';

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export const isWebPushConfigured = (): boolean => vapidDetails() !== null;

export const vapidPublicKey = (): string | null =>
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

/** Short, collision-resistant id derived from the subscription endpoint. */
export function subscriptionId(endpoint: string): string {
  return Buffer.from(endpoint)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, 80);
}

export async function saveSubscription(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  adminUserId: string;
  adminEmail: string;
  userAgent: string;
}): Promise<void> {
  const db = await getDb();
  const id = subscriptionId(input.endpoint);

  await db.collection<PushSubscription>(COLLECTIONS.pushSubscriptions).set(id, {
    id,
    endpoint: input.endpoint,
    keys: input.keys,
    adminUserId: input.adminUserId,
    adminEmail: input.adminEmail,
    userAgent: input.userAgent.slice(0, 250),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<PushSubscription>(COLLECTIONS.pushSubscriptions)
    .delete(subscriptionId(endpoint));
}

export interface PushResult {
  delivered: number;
  total: number;
  skipped: string | null;
}

/**
 * Fans a payload out to every registered kitchen device.
 *
 * Endpoints that respond 404/410 are pruned automatically, matching the
 * reference behaviour. Never throws.
 */
export async function sendPushNotification(payload: unknown): Promise<PushResult> {
  const vapid = vapidDetails();
  if (!vapid) return { delivered: 0, total: 0, skipped: 'VAPID keys not configured' };

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const db = await getDb();
  const subscriptions = db.collection<PushSubscription>(COLLECTIONS.pushSubscriptions);
  const { docs } = await subscriptions.list();

  if (docs.length === 0) {
    return { delivered: 0, total: 0, skipped: 'No registered devices' };
  }

  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(
    docs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
        delivered += 1;
        await subscriptions.update(sub.id, (current) => ({
          ...current,
          lastUsedAt: new Date().toISOString(),
        }));
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await subscriptions.delete(sub.id).catch(() => undefined);
        }
      }
    })
  );

  return { delivered, total: docs.length, skipped: null };
}