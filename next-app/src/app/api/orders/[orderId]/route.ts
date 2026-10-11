import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { requireCustomer } from '@/lib/auth/user';
import { apiError, json, withErrorHandling } from '@/lib/http/api';
import { findOrderAnywhere, getOrderForCustomer, toPublicOrder } from '@/lib/orders/service';
import { trackOrderSchema } from '@/lib/orders/schema';

export const runtime = 'nodejs';

/**
 * Public read for the customer's own order.
 *
 * Supported access models:
 * 1. Admin session – staff can inspect any order and retrieve its tracking token.
 * 2. Authenticated customer session – customers can track any order they placed.
 * 3. Secret tracking token – issued at checkout and shared via WhatsApp.
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await params;
    const token = request.nextUrl.searchParams.get('token') ?? '';

    // 1. Staff access first – an admin session can view any order
    try {
      await requireAdmin(request);
      const order = await findOrderAnywhere(orderId);
      if (!order) return apiError('Order not found', 404);
      return json({ ok: true, order: toPublicOrder(order, { includeToken: true }) });
    } catch {
      // Fall through to customer-scoped access.
    }

    // 2. Authenticated customer access – check if the requester owns this order
    try {
      const customer = await requireCustomer(request);
      const order = await findOrderAnywhere(orderId);
      if (
        order &&
        (order.userId === customer.uid ||
          (customer.email && order.userEmail?.toLowerCase() === customer.email.toLowerCase()))
      ) {
        return json({ ok: true, order: toPublicOrder(order, { includeToken: true }) });
      }
    } catch {
      // Fall through to token verification.
    }

    // 3. Token-based access
    const parsed = trackOrderSchema.safeParse({ orderId, token });
    if (!parsed.success) {
      return apiError('A valid order id and tracking token are required', 401);
    }

    const order = await getOrderForCustomer(parsed.data.orderId, parsed.data.token);
    return json({ ok: true, order: toPublicOrder(order) });
  }
);