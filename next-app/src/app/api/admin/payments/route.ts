import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { paymentLedger } from '@/lib/orders/service';
import { PAYMENT_LABELS } from '@/lib/orders/status';

export const runtime = 'nodejs';

/**
 * UPI payment ledger – the manual-verification counterpart to the reference's
 * Razorpay transactions view.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const entries = await paymentLedger(
    Number(request.nextUrl.searchParams.get('limit') ?? 100)
  );

  return json({
    ok: true,
    count: entries.length,
    entries: entries.map((entry) => ({
      ...entry,
      paymentLabel: PAYMENT_LABELS[entry.paymentStatus],
    })),
  });
});