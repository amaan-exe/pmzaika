import type { NextRequest } from 'next/server';

import { clientIp, json, rateLimit, readJson, withErrorHandling } from '@/lib/http/api';
import { createOrder, toPublicOrder } from '@/lib/orders/service';
import { optionalCustomer } from '@/lib/auth/user';

export const runtime = 'nodejs';

/**
 * Places an order.
 *
 * The client only ever sends menu ids, quantities and contact details – prices,
 * discounts, fees and availability are all resolved server-side.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { limited, retryAfterSeconds } = rateLimit(
    `order:${clientIp(request)}`,
    12,
    10 * 60 * 1000
  );

  if (limited) {
    return json(
      {
        ok: false,
        error: 'Too many orders from this device. Please wait a few minutes or call us.',
      },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const payload = await readJson(request);
  const customer = await optionalCustomer(request);
  const orderInput =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const { order, paymentProofUrl, trackingUrl } = await createOrder({
    ...orderInput,
    userId: customer?.uid ?? (orderInput.userId as string | undefined),
    userEmail: customer?.email ?? (orderInput.userEmail as string | undefined),
  });

  return json(
    {
      ok: true,
      order: toPublicOrder(order),
      // Returned exactly once, for the customer to keep in their own session.
      trackingToken: order.trackingToken,
      trackingUrl,
      paymentProofUrl,
    },
    { status: 201 }
  );
});