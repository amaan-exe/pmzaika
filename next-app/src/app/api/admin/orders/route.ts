import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { listOrders, splitList, toPublicOrder } from '@/lib/orders/service';
import { listOrdersQuerySchema } from '@/lib/orders/schema';
import { OPEN_STATUSES, ORDER_STATUS_FLOW, STATUS_ACTIONS } from '@/lib/orders/status';
import type { OrderStatus, PaymentStatus } from '@/lib/domain/types';

export const runtime = 'nodejs';

/** Filtered, paginated order queue for the kitchen dashboard. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const query = listOrdersQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );

  const { orders, total } = await listOrders({
    status: query.status
      ? query.status === 'open'
        ? OPEN_STATUSES
        : (splitList(query.status) as OrderStatus[])
      : undefined,
    paymentStatus: query.paymentStatus
      ? (splitList(query.paymentStatus) as PaymentStatus[])
      : undefined,
    orderType: query.orderType,
    search: query.search,
    from: query.from,
    to: query.to,
    userId: query.userId,
    scope: query.scope ?? 'active',
    limit: query.limit ?? 50,
    offset: query.offset ?? 0,
  });

  return json({
    ok: true,
    total,
    orders: orders.map((order) => ({
      ...toPublicOrder(order, { includeToken: true }),
      actions: STATUS_ACTIONS[order.status],
      isOpen: OPEN_STATUSES.includes(order.status),
      statusMeta: ORDER_STATUS_FLOW[order.status],
    })),
  });
});