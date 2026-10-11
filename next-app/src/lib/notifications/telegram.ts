import type { Order } from '@/lib/domain/types';
import { RESTAURANT, SITE_URL } from '@/lib/env';
import { formatRupees } from '@/lib/orders/pricing';
import { orderTrackingUrl } from '@/lib/orders/links';

/** Escapes the characters Telegram's HTML parse mode treats as markup. */
export function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function orderSummaryHtml(order: Order): string {
  const customer = escapeHtml(order.customerName || 'Guest');
  const phone = escapeHtml(order.customerPhone || 'Not provided');
  const address = escapeHtml(
    order.orderType === 'delivery'
      ? order.deliveryAddress || 'Delivery (Address pending)'
      : order.seatingNote || 'Dine-in / Takeaway'
  );

  const items = order.items && order.items.length
    ? order.items
        .map(
          (item) =>
            `   • <b>${escapeHtml(item.title)}</b> × ${item.qty} (₹${Math.round(
              item.lineTotalPaise / 100
            )})`
        )
        .join('\n')
    : '   • Order items details';

  const coupon = order.appliedCoupon
    ? `\n🎁 <b>Coupon Applied:</b> <code>${escapeHtml(order.appliedCoupon)}</code> (− ₹${Math.round(
        order.totals.discountPaise / 100
      )})`
    : '';

  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '').slice(-10);

  return `
🔔 <b>NEW ORDER RECEIVED - ${escapeHtml(RESTAURANT.name)}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${escapeHtml(order.orderId)}</code>
💰 <b>Grand Total:</b> <b>${formatRupees(order.totals.grandTotalPaise)}</b>
💳 <b>Payment:</b> ${escapeHtml((order.paymentStatus || 'awaiting').replace(/_/g, ' ').toUpperCase())}
📦 <b>Type:</b> ${order.orderType === 'delivery' ? '🛵 Doorstep Delivery' : '🍽️ Dine-in / Takeaway'}

👤 <b>Customer:</b> ${customer}
📞 <b>Phone:</b> <code>${phone}</code>
📍 <b>${order.orderType === 'delivery' ? 'Delivery Address' : 'Dine-in Note'}:</b> ${address}

📋 <b>Items Ordered:</b>
${items}
${order.notes ? `\n📝 <b>Special Instructions:</b> <i>${escapeHtml(order.notes)}</i>` : ''}${coupon}

⏰ <b>Placed At:</b> ${new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })}
━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

export interface TelegramResult {
  success: boolean;
  reason?: string;
  messageId?: number;
}

export interface TelegramInlineButton {
  text: string;
  url: string;
}

const FALLBACK_BOT_TOKEN = '8945057553:AAFgUVYpRzo0W1nZ62oqBriWOZPhm9vLuZs';
const FALLBACK_CHAT_ID = '-5485134325';

export function resolveTelegramBotToken(): string {
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  if (envToken && envToken.trim()) return envToken.trim();
  return FALLBACK_BOT_TOKEN;
}

/** Resolves chat ID from process.env or restaurant settings in database. */
export async function resolveTelegramChatId(): Promise<string> {
  const envChatId = process.env.TELEGRAM_CHAT_ID;
  if (envChatId && envChatId.trim()) {
    return envChatId.trim();
  }

  try {
    const { getSettings } = await import('@/lib/settings/service');
    const settings = await getSettings();
    const stored = (settings as Record<string, unknown>).telegramChatId;
    if (typeof stored === 'string' && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // Database read fallback silently ignored
  }

  return FALLBACK_CHAT_ID;
}

/**
 * Free, instant order alerts to the restaurant's Telegram bot / group.
 * Includes interactive action buttons to view in admin, live tracking, and 1-tap WhatsApp customer.
 */
export async function sendTelegramOrderNotification(
  order: Order
): Promise<TelegramResult> {
  const token = resolveTelegramBotToken();
  const chatId = await resolveTelegramChatId();

  if (!token || !chatId) {
    return {
      success: false,
      reason: !token
        ? 'TELEGRAM_BOT_TOKEN not configured'
        : 'TELEGRAM_CHAT_ID not configured',
    };
  }

  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '').slice(-10);
  const waUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
        `Hello ${order.customerName || 'there'}! We have received your PM Zaika order (${order.orderId}). We are preparing your delicious food!`
      )}`
    : undefined;

  let base = SITE_URL.replace(/\/$/, '');
  if (!base.startsWith('https://')) {
    base = 'https://pmzaika.vercel.app';
  }
  const adminUrl = `${base}/admin/orders?order=${encodeURIComponent(order.orderId)}`;
  const trackUrl = `${base}/track/${encodeURIComponent(order.orderId)}?token=${encodeURIComponent(order.trackingToken)}`;

  const inlineKeyboard: TelegramInlineButton[][] = [
    [
      { text: '📋 View in Admin Desk', url: adminUrl },
      { text: '🛵 Live Tracking', url: trackUrl },
    ],
  ];

  if (waUrl) {
    inlineKeyboard.push([{ text: '💬 WhatsApp Customer', url: waUrl }]);
  }

  return sendTelegramMessage(orderSummaryHtml(order), {
    inline_keyboard: inlineKeyboard,
  });
}

export async function sendTelegramMessage(
  text: string,
  replyMarkup?: { inline_keyboard: TelegramInlineButton[][] },
  explicitChatId?: string
): Promise<TelegramResult> {
  const token = resolveTelegramBotToken();
  const chatId = explicitChatId || (await resolveTelegramChatId());

  if (!token || !chatId) {
    return {
      success: false,
      reason: !token
        ? 'TELEGRAM_BOT_TOKEN not configured'
        : 'TELEGRAM_CHAT_ID not configured',
    };
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    let response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    let resData = (await response.json()) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };

    // If reply_markup failed (e.g. invalid button URL), retry without reply_markup
    if ((!response.ok || !resData.ok) && replyMarkup) {
      delete payload.reply_markup;
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      resData = (await response.json()) as {
        ok?: boolean;
        description?: string;
        result?: { message_id?: number };
      };
    }

    if (!response.ok || !resData.ok) {
      return {
        success: false,
        reason: resData.description ?? response.statusText,
      };
    }

    return { success: true, messageId: resData.result?.message_id };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown Telegram error',
    };
  }
}