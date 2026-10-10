import type { NextRequest } from 'next/server';

import { COLLECTIONS, getDb } from '@/lib/db';
import type { PushSubscription } from '@/lib/domain/types';
import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { pushSubscriptionSchema } from '@/lib/orders/schema';
import {
  isWebPushConfigured,
  removeSubscription,
  saveSubscription,
  vapidPublicKey,
} from '@/lib/notifications/webpush';

export const runtime = 'nodejs';

/** Lists registered kitchen devices and reports whether push is configured. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const { docs } = await (await getDb())
    .collection<PushSubscription>(COLLECTIONS.pushSubscriptions)
    .list();

  return json({
    ok: true,
    configured: isWebPushConfigured(),
    vapidPublicKey: vapidPublicKey(),
    count: docs.length,
    subscriptions: docs.map((sub) => ({
      id: sub.id,
      adminEmail: sub.adminEmail,
      userAgent: sub.userAgent,
      createdAt: sub.createdAt,
      lastUsedAt: sub.lastUsedAt,
    })),
  });
});

/** Registers this device for order alerts. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAdmin(request);
  const payload = pushSubscriptionSchema.parse(await readJson(request));

  await saveSubscription({
    endpoint: payload.endpoint,
    keys: payload.keys,
    adminUserId: session.uid,
    adminEmail: session.email,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  });

  return json({ ok: true }, { status: 201 });
});

/** Removes a device registration. */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return json({ ok: false, error: 'endpoint query parameter is required' }, { status: 400 });
  }

  await removeSubscription(endpoint);
  return json({ ok: true });
});