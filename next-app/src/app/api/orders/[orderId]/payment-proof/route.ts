import type { NextRequest } from 'next/server';

import { clientIp, json, rateLimit, readJson, withErrorHandling } from '@/lib/http/api';
import { attachPaymentProof } from '@/lib/orders/service';
import { paymentProofSchema } from '@/lib/orders/schema';

export const runtime = 'nodejs';

/**
 * Customer submits their UTR / payment screenshot reference.
 *
 * The order stays in `payment_verification_pending` until an admin verifies it.
 */
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const { limited } = rateLimit(
      `proof:${clientIp(request)}`,
      20,
      10 * 60 * 1000
    );
    if (limited) {
      return json(
        { ok: false, error: 'Too many attempts. Please contact us directly.' },
        { status: 429 }
      );
    }

    const { orderId } = await params;
    const payload = paymentProofSchema.parse(await readJson(request));
    const token = request.nextUrl.searchParams.get('token') || payload.token || '';

    const order = await attachPaymentProof(orderId, token, {
      transactionReference: payload.transactionReference,
      note: payload.note,
    });

    return json({
      ok: true,
      paymentStatus: order.paymentStatus,
      message: 'Payment proof received. Our team will verify it shortly.',
    });
  }
);