import type { NextRequest } from 'next/server';

import { optionalCustomer } from '@/lib/auth/user';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { getOrderForCustomer, transitionOrder } from '@/lib/orders/service';
import { cancelOrderSchema } from '@/lib/orders/schema';

export const runtime = 'nodejs';

/**
 * Cancels an order.
 *
 * The customer must supply their tracking token; staff may cancel using their
 * admin session instead.
 */
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await params;
    const payload = cancelOrderSchema.parse(await readJson(request));
    const token = request.nextUrl.searchParams.get('token') ?? '';

    const staff = await optionalCustomer(request);
    const actor = staff ? `user:${staff.uid}` : 'customer';

    // Validates ownership before attempting the transition.
    await getOrderForCustomer(orderId, token);

    const { order } = await transitionOrder(orderId, {
      status: 'cancelled',
      note: payload.reason ?? 'Cancelled by customer',
      rejectionReason: payload.reason,
      actor,
    });

    return json({
      ok: true,
      status: order.status,
      refundStatus: order.refund.status,
    });
  }
);