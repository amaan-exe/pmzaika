import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { restoreArchivedOrder, toPublicOrder } from '@/lib/orders/service';

export const runtime = 'nodejs';

/** Brings an archived (completed/cancelled) order back into the live queue. */
export const POST = withErrorHandling(
  async (_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) => {
    await requireAdmin(_request);
    const { orderId } = await params;

    const order = await restoreArchivedOrder(orderId);
    return json({ ok: true, order: toPublicOrder(order, { includeToken: true }) });
  }
);