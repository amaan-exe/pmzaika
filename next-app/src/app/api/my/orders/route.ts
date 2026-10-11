import type { NextRequest } from 'next/server';

import { requireCustomer } from '@/lib/auth/user';
import { json, withErrorHandling } from '@/lib/http/api';
import { toPublicOrder } from '@/lib/orders/service';
import { listUserOrders } from '@/lib/users/service';

export const runtime = 'nodejs';

/** Order history for the signed-in customer, newest first. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireCustomer(request);
  const orders = await listUserOrders(session.uid, session.email);

  return json({
    ok: true,
    count: orders.length,
    orders: orders.map((order) => toPublicOrder(order, { includeToken: true })),
  });
});