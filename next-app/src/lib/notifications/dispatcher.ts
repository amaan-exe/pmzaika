import { COLLECTIONS, getDb } from '@/lib/db';
import type { Order, WebhookLog } from '@/lib/domain/types';
import { RESTAURANT } from '@/lib/env';
import { formatRupees } from '@/lib/orders/pricing';
import { orderTrackingUrl } from '@/lib/orders/links';
import { sendTelegramOrderNotification } from '@/lib/notifications/telegram';
import { sendPushNotification } from '@/lib/notifications/webpush';
import type {
  DispatchChannel,
  DispatchResult,
  OrderEventName,
} from '@/lib/notifications/events';

const MAX_LOG_DETAIL = 500;

interface LogEntry {
  source: string;
  event: string;
  reference: string;
  status: 'success' | 'failed' | 'skipped';
  detail: string;
}

async function log(entry: LogEntry): Promise<void> {
  try {
    const db = await getDb();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: WebhookLog = {
      ...entry,
      id,
      detail: entry.detail.slice(0, MAX_LOG_DETAIL),
      createdAt: new Date().toISOString(),
    };
    await db.collection<WebhookLog>(COLLECTIONS.webhookLogs).set(id, record);
  } catch (error) {
    console.error('[pm-zaika] failed to write notification log', error);
  }
}

/** Generic outbound webhook so SMS/email/automation can be added without code changes. */
async function dispatchWebhook(order: Order, event: OrderEventName): Promise<DispatchChannel> {
  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return { name: 'webhook', attempted: false, success: false, detail: 'Not configured' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        restaurant: RESTAURANT.name,
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderType: order.orderType,
        grandTotal: formatRupees(order.totals.grandTotalPaise),
        customer: { name: order.customerName, phone: order.customerPhone },
        items: order.items.map((item) => ({ title: item.title, qty: item.qty })),
        trackingUrl: orderTrackingUrl(order),
      }),
      signal: AbortSignal.timeout(5000),
    });

    return {
      name: 'webhook',
      attempted: true,
      success: response.ok,
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: 'webhook',
      attempted: true,
      success: false,
      detail: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

/**
 * Atomically claims the "notify this order" flag.
 *
 * Returns `false` when another request already dispatched, so a double-submitted
 * order never produces two kitchen alerts.
 */
async function claimNotification(orderId: string): Promise<boolean> {
  const db = await getDb();
  const orders = db.collection<Order>(COLLECTIONS.orders);

  const claimed = await orders.update(orderId, (current) => {
    if (current.notificationSent) return null;
    return {
      ...current,
      notificationSent: true,
      notificationEmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return claimed !== null;
}

export interface DispatchOptions {
  /** Status-change events may be dispatched more than once by design. */
  idempotent?: boolean;
}

/**
 * Fans an order event out to every configured channel.
 *
 * Each channel is isolated: a failing Telegram call or push endpoint can never
 * fail the order request, matching the reference implementation's guarantee.
 */
export async function dispatchOrderNotification(
  order: Order,
  event: OrderEventName,
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  if (options.idempotent !== false) {
    const claimed = await claimNotification(order.id);
    if (!claimed) {
      return { event, duplicate: true, channels: [] };
    }
  }

  const channels: DispatchChannel[] = [];

  const [telegram, push, webhook] = await Promise.all([
    // Telegram alerts are sent STRICTLY when a new order is placed by a customer
    (event === 'order.created'
      ? sendTelegramOrderNotification(order)
      : Promise.resolve<import('@/lib/notifications/telegram').TelegramResult>({
          success: true,
          reason: 'skipped: telegram only sent on new orders',
        })
    )
      .then((result) => {
        const channel: DispatchChannel = {
          name: 'telegram',
          attempted: event === 'order.created',
          success: result.success,
          detail: result.reason ?? `message ${result.messageId ?? '?'}`,
        };
        channels.push(channel);
        return channel;
      })
      .catch((error: Error) => {
        const channel: DispatchChannel = {
          name: 'telegram',
          attempted: true,
          success: false,
          detail: error.message,
        };
        channels.push(channel);
        return channel;
      }),

    sendPushNotification({
      title: `${event === 'order.created' ? '🚨 LOUD ALERT: New Order' : '📦 Order Update'} #${order.orderId}`,
      body: `💰 ${formatRupees(order.totals.grandTotalPaise)} • ${order.customerName} • ${
        order.items.length
      } item${order.items.length === 1 ? '' : 's'} (${order.orderType === 'delivery' ? '🛵 DELIVERY' : '🍽️ DINE-IN'})`,
      tag: `order-${order.orderId}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: {
        orderId: order.orderId,
        url: `/admin/orders?order=${encodeURIComponent(order.orderId)}`,
        status: order.status,
      },
    })
      .then((result) => {
        const channel: DispatchChannel = {
          name: 'webpush',
          attempted: true,
          success: result.delivered > 0,
          detail: result.skipped ?? `${result.delivered}/${result.total} devices`,
        };
        channels.push(channel);
        return channel;
      })
      .catch((error: Error) => {
        const channel: DispatchChannel = {
          name: 'webpush',
          attempted: true,
          success: false,
          detail: error.message,
        };
        channels.push(channel);
        return channel;
      }),

    dispatchWebhook(order, event).then((channel) => {
      channels.push(channel);
      return channel;
    }),
  ]);

  void telegram;
  void push;
  void webhook;

  for (const channel of channels) {
    await log({
      source: channel.name,
      event,
      reference: order.orderId,
      status: channel.attempted ? (channel.success ? 'success' : 'failed') : 'skipped',
      detail: channel.detail,
    });
  }

  return { event, duplicate: false, channels };
}

export async function listWebhookLogs(limit = 100) {
  const db = await getDb();
  const { docs } = await db.collection<WebhookLog>(COLLECTIONS.webhookLogs).list({
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    limit,
  });
  return docs;
}