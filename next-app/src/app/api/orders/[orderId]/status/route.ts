import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import type { OrderStatus } from '@/lib/domain/types';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { statusUpdateSchema } from '@/lib/orders/schema';
import { toPublicOrder, transitionOrder } from '@/lib/orders/service';

export const runtime = 'nodejs';

/**
 * Admin status transition, e.g. `payment_verification_pending → confirmed`, which
 * simultaneously marks the UPI payment as verified.
 */
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const session = await requireAdmin(request);
    const { orderId } = await params;

    const payload = statusUpdateSchema.parse(await readJson(request));

    const { order } = await transitionOrder(orderId, {
      status: payload.status as OrderStatus,
      note: payload.note,
      rejectionReason: payload.rejectionReason,
      actor: `admin:${session.uid}`,
    });

    return json({ ok: true, order: toPublicOrder(order, { includeToken: true }) });
  }
);