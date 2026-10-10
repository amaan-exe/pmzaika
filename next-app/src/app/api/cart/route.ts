import type { NextRequest } from 'next/server';

import { clientIp, json, rateLimit, readJson, withErrorHandling } from '@/lib/http/api';
import { clearCart, hydrateCart, readCart, writeCart } from '@/lib/cart/service';
import { ensureCartSession } from '@/lib/cart/session';
import { cartSyncSchema } from '@/lib/orders/schema';

export const runtime = 'nodejs';

/** Hydrates the cart from the server so it survives a new device or cleared storage. */
export const GET = withErrorHandling(async () => {
  const sessionId = await ensureCartSession();
  const cart = (await readCart(sessionId)) ?? (await hydrateCart([]));

  return json({ ok: true, sessionId, cart });
});

/** Mirrors the client cart to the server (debounced from the cart context). */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { limited, retryAfterSeconds } = rateLimit(
    `cart:${clientIp(request)}`,
    120,
    60 * 1000
  );

  if (limited) {
    return json(
      { ok: false, error: 'Cart sync is temporarily rate limited.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const sessionId = await ensureCartSession();
  const { items } = cartSyncSchema.parse(await readJson(request));
  const cart = await writeCart(sessionId, items);

  return json({ ok: true, sessionId, cart });
});

/** Empties the server-side cart, e.g. right after a successful checkout. */
export const DELETE = withErrorHandling(async () => {
  const sessionId = await ensureCartSession();
  await clearCart(sessionId);
  return json({ ok: true });
});