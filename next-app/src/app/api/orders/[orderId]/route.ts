import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { apiError, json, withErrorHandling } from '@/lib/http/api';
import { findOrderAnywhere, getOrderForCustomer, toPublicOrder } from '@/lib/orders/service';
import { trackOrderSchema } from '@/lib/orders/schema';

export const runtime = 'nodejs';

/**
 * Public read for the customer's own order.
 *
 * Requires the tracking token issued at checkout, so an order id on its own never
 * exposes customer details. Staff with a valid admin session can read any order
 * and receive the tracking token so they can share the customer link.
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await params;
    const token = request.nextUrl.searchParams.get('token') ?? '';

    try {
      // Staff access first – an admin session should never be blocked by a token.
      await requireAdmin(request);
      const order = await findOrderAnywhere(orderId);
      if (!order) return apiError('Order not found', 404);
      return json({ ok: true, order: toPublicOrder(order, { includeToken: true }) });
    } catch {
      // Fall through to customer-scoped access.
    }

    const parsed = trackOrderSchema.safeParse({ orderId, token });
    if (!parsed.success) {
      return apiError('A valid order id and tracking token are required', 401);
    }

    const order = await getOrderForCustomer(parsed.data.orderId, parsed.data.token);
    return json({ ok: true, order: toPublicOrder(order) });
  }
);