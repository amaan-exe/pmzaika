import { randomBytes } from 'node:crypto';

import { COLLECTIONS, getDb } from '@/lib/db';
import type { Doc } from '@/lib/db/types';
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  RefundState,
} from '@/lib/domain/types';
import { ensureProfileFromOrder } from '@/lib/users/service';
import { buildOrderUpi, upiAppLinks } from '@/lib/payments/upi';
import { computeTotals } from '@/lib/orders/pricing';
import { orderTrackingUrl } from '@/lib/orders/links';
import {
  isTerminal,
  isTransitionAllowed,
  ORDER_STATUS_FLOW,
  paymentStatusFor,
  STATUS_ACTIONS,
  type StatusAction,
} from '@/lib/orders/status';
import { createOrderSchema, type CreateOrderInput } from '@/lib/orders/schema';
import { resolveOrderLines } from '@/lib/menu/service';
import { getSettings, storeAvailability } from '@/lib/settings/service';
import { trackCouponUsage, validateCoupon } from '@/lib/coupons/service';
import {
  buildPaymentProofRequest,
  paymentProofWhatsAppUrl,
  whatsappUrl,
} from '@/lib/notifications/whatsapp';
import { dispatchOrderNotification } from '@/lib/notifications/dispatcher';

export class OrderError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

const nowIso = () => new Date().toISOString();

const orders = async () => (await getDb()).collection<Order>(COLLECTIONS.orders);

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

function dateStamp(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

async function generateOrderId(): Promise<string> {
  const collection = await orders();
  const stamp = dateStamp();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `PMZ-${stamp}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!(await collection.get(candidate))) return candidate;
  }

  return `PMZ-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

export interface PublicOrder
  extends Omit<Order, 'trackingToken' | 'cartSessionId' | 'upi'> {
  upi: Order['upi'];
  statusMeta: (typeof ORDER_STATUS_FLOW)[OrderStatus];
  nextActions: StatusAction[];
  trackingPath: string;
  trackingUrl: string;
  upiAppLinks: Array<{ label: string; href: string }>;
  /** Staff-only: allows an admin to share the customer's tracking link. */
  trackingToken?: string;
}

/**
 * Customer-facing projection.
 *
 * The tracking token is the caller's own secret and is never echoed back by the
 * public endpoints, so it cannot leak via logs or shared screenshots.
 */
export function toPublicOrder(
  order: Order,
  options?: { includeToken?: boolean }
): PublicOrder {
  // The tracking token is the caller's own secret and is stripped here so it can
// never leak into a public response, log line or shared screenshot.
  const { trackingToken, cartSessionId: _cartSessionId, ...rest } = order;

  return {
    ...rest,
    statusMeta: ORDER_STATUS_FLOW[order.status],
    nextActions: STATUS_ACTIONS[order.status],
    trackingPath: `/track/${order.orderId}`,
    trackingUrl: orderTrackingUrl(order),
    upiAppLinks: upiAppLinks(order.upi.intent),
    ...(options?.includeToken ? { trackingToken } : {}),
  };
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export interface CreatedOrder {
  order: Order;
  /** Ready-to-open link carrying the order details and a proof request. */
  paymentProofUrl: string;
  trackingUrl: string;
}

export async function createOrder(rawInput: unknown): Promise<CreatedOrder> {
  const parsed = createOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.') || '_'] ??= issue.message;
    }
    throw new OrderError('Please fix the highlighted fields', 422, fields);
  }

  const input: CreateOrderInput = parsed.data;
  const settings = await getSettings();

  // Closed store shield – enforced server-side, never trusted to the client.
  const availability = storeAvailability(settings);
  if (!availability.acceptingOrders) {
    throw new OrderError(availability.reason ?? 'Restaurant is closed', 403);
  }

  const { items, unavailable } = await resolveOrderLines(input.items);
  if (unavailable.length > 0) {
    throw new OrderError('Some items are no longer available', 422, {
      items: `Unavailable: ${unavailable.join(', ')}`,
    });
  }
  if (items.length === 0) {
    throw new OrderError('Your cart is empty', 422);
  }

  const subtotalPaise = items.reduce((sum, item) => sum + item.lineTotalPaise, 0);

  if (settings.minimumOrderPaise > 0 && subtotalPaise < settings.minimumOrderPaise) {
    throw new OrderError(
      `Minimum order value is ₹${settings.minimumOrderPaise / 100}`,
      422,
      { items: `Add ₹${(settings.minimumOrderPaise - subtotalPaise) / 100} more to continue` }
    );
  }

  // Coupon is re-validated server-side; the client never dictates a discount.
  let discountPaise = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    const result = await validateCoupon(input.couponCode, {
      subtotalPaise,
      categories: items.map((item) => item.category),
      userKey: input.userId || input.userEmail,
    });

    if (!result.valid) {
      throw new OrderError(result.reason ?? 'Invalid coupon code', 422, {
        couponCode: result.reason ?? 'Invalid coupon code',
      });
    }

    discountPaise = result.discountPaise;
    couponId = result.coupon?.id ?? null;
  }

  const totals = computeTotals({
    lines: items.map((item) => ({ pricePaise: item.pricePaise, qty: item.qty })),
    orderType: input.orderType,
    settings,
    discountPaise,
  });

  const orderId = await generateOrderId();
  const createdAt = nowIso();

  const refund: RefundState = {
    requested: false,
    status: 'NONE',
    amountPaise: 0,
  };

  const order: Order = {
    id: orderId,
    orderId,
    userId: input.userId ?? `guest:${input.customer.phone}`,
    userEmail: input.userEmail ?? '',
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    deliveryAddress: input.customer.address ?? '',
    seatingNote: input.customer.tableNote ?? '',
    orderType: input.orderType,
    items: items.map((item) => ({ ...item })),
    totals,
    appliedCoupon: input.couponCode ? input.couponCode.trim().toUpperCase() : null,
    couponId,
    taxMode: (settings.gstPercentage ?? 0) > 0 ? 'exclusive' : 'inclusive',
    paymentMethod: 'UPI',
    paymentStatus: 'awaiting',
    transactionReference: input.transactionReference ?? null,
    customerMarkedPaid: input.customerMarkedPaid ?? false,
    paymentProofNote: null,
    paymentVerifiedBy: null,
    paymentVerifiedAt: null,
    rejectionReason: null,
    upi: buildOrderUpi(orderId, totals.grandTotalPaise, input.customer.name, settings),
    status: 'payment_verification_pending',
    refund,
    timeline: [
      {
        status: 'payment_verification_pending',
        paymentStatus: 'awaiting',
        at: createdAt,
        actor: 'customer',
        note: 'Order placed. Awaiting UPI payment proof.',
      },
    ],
    notificationSent: false,
    notificationEmittedAt: null,
    trackingToken: randomBytes(24).toString('base64url'),
    cartSessionId: input.cartSessionId ?? '',
    notes: input.notes,
    createdAt,
    updatedAt: createdAt,
  };

  const saved = await (await orders()).set(orderId, order);
  invalidateStatsCache();

  // Run secondary side-effects in background so customer gets instant checkout response
  void ensureProfileFromOrder(
    order.userId,
    order.userEmail,
    order.customerName,
    order.customerPhone
  ).catch((error) => console.error('[pm-zaika] profile update failed', error));

  if (order.appliedCoupon) {
    void trackCouponUsage(order.appliedCoupon, order.userId).catch((error) =>
      console.error('[pm-zaika] coupon usage tracking failed', error)
    );
  }

  const paymentProofUrl = paymentProofWhatsAppUrl(saved);

  // Dispatch notifications asynchronously to prevent any third-party webhook/telegram latency from delaying customer
  void dispatchOrderNotification(saved, 'order.created').catch((error) =>
    console.error('[pm-zaika] notification dispatch failed', error)
  );

  return { order: saved, paymentProofUrl, trackingUrl: orderTrackingUrl(saved) };
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export async function getOrderById(orderId: string): Promise<Order | null> {
  return (await orders()).get(orderId);
}

/** Reads an order from the live queue, then from the archive. */
export async function findOrderAnywhere(orderId: string): Promise<Order | null> {
  const db = await getDb();

  for (const name of [COLLECTIONS.orders, COLLECTIONS.orderArchive] as const) {
    const order = await db.collection<Order>(name).get(orderId);
    if (order) return order;
  }

  return null;
}

/**
 * Reads an order using its tracking token, which acts as a shared secret so an
 * order id alone never exposes a customer's details.
 */
export async function getOrderForCustomer(
  orderId: string,
  token: string
): Promise<Order> {
  const db = await getDb();

  for (const name of [COLLECTIONS.orders, COLLECTIONS.orderArchive] as const) {
    const order = await db.collection<Order>(name).get(orderId);
    if (order && order.trackingToken === token) return order;
  }

  throw new OrderError(
    'We could not find that order. Please check the link we sent you on WhatsApp.',
    404
  );
}

export interface OrderFilters {
  status?: string[];
  paymentStatus?: string[];
  orderType?: string;
  search?: string;
  from?: string;
  to?: string;
  userId?: string;
  scope?: 'active' | 'archive' | 'all';
  limit?: number;
  offset?: number;
}

export interface OrderPage {
  orders: Order[];
  total: number;
}

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/** Filtered order queue. Fuzzy search runs in memory after the indexed filters. */
export async function listOrders(filters: OrderFilters): Promise<OrderPage> {
  const db = await getDb();
  const scope = filters.scope ?? 'active';

  const names =
    scope === 'all'
      ? [COLLECTIONS.orders, COLLECTIONS.orderArchive]
      : scope === 'archive'
        ? [COLLECTIONS.orderArchive]
        : [COLLECTIONS.orders];

  const collected: Order[] = [];

  for (const name of names) {
    const { docs } = await db.collection<Order>(name).list({
      filters: [
        ...(filters.status?.length
          ? [{ field: 'status', op: 'in' as const, value: filters.status }]
          : []),
        ...(filters.paymentStatus?.length
          ? [
              {
                field: 'paymentStatus',
                op: 'in' as const,
                value: filters.paymentStatus,
              },
            ]
          : []),
        ...(filters.orderType
          ? [{ field: 'orderType', op: '==' as const, value: filters.orderType }]
          : []),
        ...(filters.userId
          ? [{ field: 'userId', op: '==' as const, value: filters.userId }]
          : []),
        ...(filters.from
          ? [{ field: 'createdAt', op: '>=' as const, value: filters.from }]
          : []),
        ...(filters.to
          ? [{ field: 'createdAt', op: '<' as const, value: filters.to }]
          : []),
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    collected.push(...docs);
  }

  let result = collected.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    result = result.filter(
      (order) =>
        order.orderId.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle) ||
        order.customerPhone.includes(needle)
    );
  }

  const total = result.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;

  return { orders: result.slice(offset, offset + limit), total };
}

export interface DashboardStats {
  totalOrders: number;
  openOrders: number;
  awaitingPayment: number;
  revenuePaise: number;
  paidRevenuePaise: number;
  averageOrderValuePaise: number;
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  lowStockCount: number;
}

let statsCache: { data: DashboardStats; timestamp: number; key: string } | null = null;

export function invalidateStatsCache(): void {
  statsCache = null;
}

export async function orderStats(
  range: { from?: string; to?: string } = {}
): Promise<DashboardStats> {
  const cacheKey = `${range.from ?? ''}:${range.to ?? ''}`;
  if (statsCache && statsCache.key === cacheKey && Date.now() - statsCache.timestamp < 15_000) {
    return statsCache.data;
  }

  const { orders: all } = await listOrders({
    from: range.from,
    to: range.to,
    scope: 'all',
    limit: Number.MAX_SAFE_INTEGER,
  });
  const lowStockCount = await countUnavailableMenuItems();

  const completed = all.filter(
    (order) => order.status === 'delivered' || order.status === 'served'
  );
  const paid = all.filter((order) => order.paymentStatus === 'verified');

  const byStatus: Record<string, number> = {};
  const byPaymentStatus: Record<string, number> = {};
  for (const order of all) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
    byPaymentStatus[order.paymentStatus] =
      (byPaymentStatus[order.paymentStatus] ?? 0) + 1;
  }

  const grossPaise = all.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0);

  const data: DashboardStats = {
    totalOrders: all.length,
    openOrders: all.filter((order) => !isTerminal(order.status)).length,
    awaitingPayment: all.filter(
      (order) => order.paymentStatus === 'awaiting' || order.paymentStatus === 'verification_pending'
    ).length,
    revenuePaise: completed.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0),
    paidRevenuePaise: paid.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0),
    averageOrderValuePaise: all.length === 0 ? 0 : Math.round(grossPaise / all.length),
    byStatus,
    byPaymentStatus,
    lowStockCount,
  };

  statsCache = { data, timestamp: Date.now(), key: cacheKey };
  return data;
}

/** Payment ledger – replaces the Razorpay transaction view with UPI records. */
export async function paymentLedger(limit = 100) {
  const { orders: all } = await listOrders({
    scope: 'all',
    limit: Number.MAX_SAFE_INTEGER,
  });

  return all
    .filter((order) => order.paymentStatus !== 'awaiting')
    .sort((a, b) => (b.paymentVerifiedAt ?? b.createdAt).localeCompare(a.paymentVerifiedAt ?? a.createdAt))
    .slice(0, limit)
    .map((order) => ({
      orderId: order.orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      amountPaise: order.totals.grandTotalPaise,
      paymentStatus: order.paymentStatus,
      transactionReference: order.transactionReference,
      method: order.paymentMethod,
      verifiedBy: order.paymentVerifiedBy,
      verifiedAt: order.paymentVerifiedAt,
      createdAt: order.createdAt,
    }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface TransitionOptions {
  status: OrderStatus;
  note?: string;
  rejectionReason?: string;
  actor: string;
}

export interface TransitionResult {
  order: Order;
  event: 'order.payment_verified' | 'order.cancelled' | 'order.completed' | 'order.status_changed';
}

/**
 * Applies a status transition, enforcing the state machine.
 *
 * Runs as a transaction so two staff members cannot both accept the same order.
 */
export async function transitionOrder(
  orderId: string,
  options: TransitionOptions
): Promise<TransitionResult> {
  if (!ORDER_STATUS_FLOW[options.status]) {
    throw new OrderError(`Unknown status "${options.status}"`, 422);
  }

  const db = await getDb();
  const at = nowIso();

  const updated = await db.collection<Order>(COLLECTIONS.orders).update(orderId, (current) => {
    if (!isTransitionAllowed(current.status, options.status, current.paymentStatus)) {
      throw new OrderError(
        `Cannot move an order from "${current.status}" to "${
          options.status
        }" while payment is "${current.paymentStatus}"`,
        409
      );
    }

    const paymentStatus: PaymentStatus = paymentStatusFor(options.status, current.paymentStatus);
    const completing = options.status === 'delivered' || options.status === 'served';

    const refund: RefundState =
      options.status === 'cancelled' && current.paymentStatus === 'verified'
        ? {
            ...current.refund,
            status: 'REQUESTED',
            requested: true,
            requestedAt: at,
            amountPaise: current.totals.grandTotalPaise,
            cancellationReason: options.rejectionReason ?? options.note,
          }
        : current.refund;

    return {
      ...current,
      status: options.status,
      paymentStatus,
      rejectionReason:
        options.rejectionReason ?? (paymentStatus === 'rejected' ? options.note ?? null : current.rejectionReason),
      paymentVerifiedBy:
        paymentStatus === 'verified' && !current.paymentVerifiedBy
          ? options.actor
          : current.paymentVerifiedBy,
      paymentVerifiedAt:
        paymentStatus === 'verified' && !current.paymentVerifiedAt
          ? at
          : current.paymentVerifiedAt,
      refund,
      completedAt: completing ? at : current.completedAt,
      updatedAt: at,
      timeline: [
        ...current.timeline,
        {
          status: options.status,
          paymentStatus,
          at,
          actor: options.actor,
          note: options.note ?? options.rejectionReason,
        },
      ],
    };
  });

  if (!updated) throw new OrderError('Order not found', 404);

  const completing = options.status === 'delivered' || options.status === 'served';

  const event: TransitionResult['event'] =
    options.status === 'cancelled'
      ? 'order.cancelled'
      : completing
        ? 'order.completed'
        : updated.paymentStatus === 'verified' && updated.status === 'confirmed'
          ? 'order.payment_verified'
          : 'order.status_changed';

  // Progress updates are intentionally not deduplicated; only the initial
  // "new order" alert uses the idempotency flag.
  await dispatchOrderNotification(updated, event, { idempotent: false });

  // Terminal orders move out of the live kitchen queue, mirroring the reference.
  if (completing || options.status === 'cancelled') {
    const { archiveOrder } = await import('@/lib/orders/archive');
    await archiveOrder(updated).catch((error) =>
      console.error('[pm-zaika] order archival failed', error)
    );
  }

  invalidateStatsCache();
  return { order: updated, event };
}

/** Records the customer's UTR / payment note against a pending order. */
export async function attachPaymentProof(
  orderId: string,
  token: string,
  input: { transactionReference?: string; note?: string }
): Promise<Order> {
  const db = await getDb();
  const at = nowIso();

  const updated = await db.collection<Order>(COLLECTIONS.orders).update(orderId, (current) => {
    if (current.trackingToken !== token) throw new OrderError('Order not found', 404);
    if (current.status !== 'payment_verification_pending') {
      throw new OrderError('This order is no longer awaiting payment', 409);
    }

    return {
      ...current,
      customerMarkedPaid: true,
      paymentStatus: 'verification_pending' as PaymentStatus,
      transactionReference: input.transactionReference ?? current.transactionReference,
      paymentProofNote: input.note ?? current.paymentProofNote,
      updatedAt: at,
      timeline: [
        ...current.timeline,
        {
          status: current.status,
          paymentStatus: 'verification_pending' as PaymentStatus,
          at,
          actor: 'customer',
          note: input.transactionReference
            ? `Payment proof submitted (UTR ${input.transactionReference}).`
            : 'Payment proof submitted.',
        },
      ],
    };
  });

  if (!updated) throw new OrderError('Order not found', 404);
  return updated;
}

/**
 * Records an admin decision on a refund.
 *
 * Refunds are settled after cancellation, by which point the order has usually
 * already been archived, so both collections are updated.
 */
export async function updateRefund(
  orderId: string,
  input: { status: RefundState['status']; note?: string },
  actor: string
): Promise<Order> {
  const db = await getDb();
  const at = nowIso();

  const apply = (current: Order): Order => {
    const refund: RefundState = {
      ...current.refund,
      status: input.status,
      processedAt: at,
      refundedBy: actor,
      refundedAt: input.status === 'REFUNDED' ? at : current.refund.refundedAt,
      amountPaise:
        input.status === 'REFUNDED'
          ? current.refund.amountPaise || current.totals.grandTotalPaise
          : current.refund.amountPaise,
    };

    return {
      ...current,
      refund,
      paymentStatus:
        input.status === 'REFUNDED' ? ('refunded' as PaymentStatus) : current.paymentStatus,
      updatedAt: at,
      timeline: [
        ...current.timeline,
        {
          status: current.status,
          paymentStatus:
            input.status === 'REFUNDED' ? ('refunded' as PaymentStatus) : current.paymentStatus,
          at,
          actor,
          note: input.note ?? `Refund marked ${input.status.toLowerCase()}`,
        },
      ],
    };
  };

  const live = await db.collection<Order>(COLLECTIONS.orders).update(orderId, apply);
  if (live) return live;

  const archived = await db.collection<Order>(COLLECTIONS.orderArchive).update(orderId, apply);
  if (archived) return archived;

  throw new OrderError('Order not found', 404);
}

/** Restores an archived order back into the active queue. */
export async function restoreArchivedOrder(orderId: string): Promise<Order> {
  const db = await getDb();
  const archived = await db.collection<Order>(COLLECTIONS.orderArchive).get(orderId);
  if (!archived) throw new OrderError('Archived order not found', 404);

  const { archivedAt: _archivedAt, ...restored } = archived;
  const doc: Order = { ...restored, updatedAt: nowIso() };

  await db.collection<Order>(COLLECTIONS.orders).set(orderId, doc);
  await db.collection<Order>(COLLECTIONS.orderArchive).delete(orderId);

  return doc;
}

/** CSV export for the admin desk / accounting. */
export async function ordersToCsv(filters: OrderFilters): Promise<string> {
  const { orders } = await listOrders({ ...filters, limit: Number.MAX_SAFE_INTEGER });

  const header = [
    'Order ID',
    'Created At',
    'Status',
    'Payment Status',
    'Type',
    'Customer',
    'Phone',
    'Address',
    'Items',
    'Subtotal',
    'Discount',
    'Delivery',
    'GST',
    'Grand Total',
    'UTR',
    'Verified By',
  ];

  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

  const rows = orders.map((order) =>
    [
      order.orderId,
      order.createdAt,
      order.status,
      order.paymentStatus,
      order.orderType,
      order.customerName,
      order.customerPhone,
      order.orderType === 'delivery' ? order.deliveryAddress : order.seatingNote,
      order.items.map((item) => `${item.title} x${item.qty}`).join(' | '),
      (order.totals.subtotalPaise / 100).toFixed(2),
      (order.totals.discountPaise / 100).toFixed(2),
      (order.totals.deliveryChargePaise / 100).toFixed(2),
      (order.totals.taxPaise / 100).toFixed(2),
      (order.totals.grandTotalPaise / 100).toFixed(2),
      order.transactionReference ?? '',
      order.paymentVerifiedBy ?? '',
    ]
      .map((cell) => escape(String(cell)))
      .join(',')
  );

  return [header.join(','), ...rows].join('\n');
}

/** Used by the stats endpoint to count menu items currently unavailable (reuses cached menu). */
export async function countUnavailableMenuItems(): Promise<number> {
  const { listMenu } = await import('@/lib/menu/service');
  const items = await listMenu({ includeUnavailable: true });
  return items.filter((item) => !item.isAvailable).length;
}

export { splitList };