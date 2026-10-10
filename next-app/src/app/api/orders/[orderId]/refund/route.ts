import type { NextRequest } from 'next/server';

import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { updateRefund, toPublicOrder } from '@/lib/orders/service';
import { requireAdmin } from '@/lib/auth/admin';
import { z } from 'zod';

export const runtime = 'nodejs';

const refundSchema = z.object({
  status: z.enum(['REQUESTED', 'PROCESSING', 'REFUNDED', 'REJECTED']),
  note: z.string().trim().max(300).optional(),
});

/** Admin records the outcome of a refund for a cancelled, paid order. */
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    const session = await requireAdmin(request);
    const { orderId } = await params;
    const payload = refundSchema.parse(await readJson(request));

    const order = await updateRefund(orderId, payload, `admin:${session.uid}`);

    return json({ ok: true, order: toPublicOrder(order, { includeToken: true }) });
  }
);