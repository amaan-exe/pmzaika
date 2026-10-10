import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { withErrorHandling } from '@/lib/http/api';
import { listOrdersQuerySchema } from '@/lib/orders/schema';
import { ordersToCsv, splitList } from '@/lib/orders/service';
import type { OrderStatus, PaymentStatus } from '@/lib/domain/types';

export const runtime = 'nodejs';

/** CSV export of the order book, respecting the same filters as the dashboard. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const query = listOrdersQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );

  const csv = await ordersToCsv({
    status: query.status ? (splitList(query.status) as OrderStatus[]) : undefined,
    paymentStatus: query.paymentStatus
      ? (splitList(query.paymentStatus) as PaymentStatus[])
      : undefined,
    orderType: query.orderType,
    search: query.search,
    from: query.from,
    to: query.to,
    scope: query.scope ?? 'all',
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pm-zaika-orders-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});