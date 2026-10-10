import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { getOrderForCustomer } from '@/lib/orders/service';
import {
  buildCancellationMessage,
  buildKitchenNotification,
  buildPaymentProofRequest,
  buildPaymentVerifiedMessage,
  buildStatusUpdateMessage,
  toWhatsappNumber,
  whatsappUrl,
} from '@/lib/notifications/whatsapp';
import { RESTAURANT } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Pre-built WhatsApp links for an order, so any surface (tracker, dashboard,
 * print view) can hand off to the same canonical messages.
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await params;
    const token = request.nextUrl.searchParams.get('token') ?? '';

    try {
      await requireAdmin(request);
    } catch {
      // Customers must prove ownership with their tracking token.
    }

    const order = await getOrderForCustomer(orderId, token);

    return json({
      ok: true,
      kitchen: {
        phone: RESTAURANT.whatsapp,
        message: buildKitchenNotification(order),
        url: whatsappUrl(RESTAURANT.whatsapp, buildKitchenNotification(order)),
      },
      paymentProof: {
        phone: toWhatsappNumber(order.customerPhone),
        message: buildPaymentProofRequest(order),
        url: whatsappUrl(order.customerPhone, buildPaymentProofRequest(order)),
      },
      paymentVerified: {
        message: buildPaymentVerifiedMessage(order),
        url: whatsappUrl(order.customerPhone, buildPaymentVerifiedMessage(order)),
      },
      statusUpdate: {
        message: buildStatusUpdateMessage(order, order.status),
        url: whatsappUrl(
          order.customerPhone,
          buildStatusUpdateMessage(order, order.status)
        ),
      },
      cancellation: {
        message: buildCancellationMessage(order, order.refund.cancellationReason),
        url: whatsappUrl(
          order.customerPhone,
          buildCancellationMessage(order, order.refund.cancellationReason)
        ),
      },
    });
  }
);