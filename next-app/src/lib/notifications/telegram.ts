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

  const totalQty = order.items && order.items.length
    ? order.items.reduce((sum, item) => sum + (item.qty || 1), 0)
    : 0;

  const items = order.items && order.items.length
    ? order.items
        .map(
          (item, idx) =>
            `   ${idx + 1}. <b>${escapeHtml(item.title)}</b> × <b>${item.qty}</b> (₹${Math.round(
              item.lineTotalPaise / 100
            )})`
        )
        .join('\n')
    : '   • No item details provided';

  const coupon = order.appliedCoupon
    ? `\n🎁 <b>Coupon Applied:</b> <code>${escapeHtml(order.appliedCoupon)}</code> (− ₹${Math.round(
        order.totals.discountPaise / 100
      )})`
    : '';

  const notes = order.notes
    ? `\n📝 <b>Kitchen Note:</b> <i>${escapeHtml(order.notes)}</i>`
    : '';

  const paymentStatus = (order.paymentStatus || 'awaiting').replace(/_/g, ' ').toUpperCase();
  const paymentBadge =
    order.paymentStatus === 'verified'
      ? `✅ <b>PAID & VERIFIED ONLINE</b>`
      : order.paymentStatus === 'verification_pending'
      ? `⏳ <b>UPI VERIFICATION PENDING</b>`
      : `⚠️ <b>${paymentStatus} (COLLECT ON DELIVERY)</b>`;

  const orderTypeBadge =
    order.orderType === 'delivery'
      ? '🛵 <b>DOORSTEP DELIVERY</b>'
      : '🍽️ <b>DINE-IN / TAKEAWAY</b>';

  const timeFormatted = new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `
🚨 <b>LOUD KITCHEN ALERT: NEW ORDER</b> 🚨
🏪 <b>${escapeHtml(RESTAURANT.name)} Kitchen Desk</b>
━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>#${escapeHtml(order.orderId)}</code>
💰 <b>COLLECT / TOTAL:</b> <b>${formatRupees(order.totals.grandTotalPaise)}</b>
💳 <b>Payment:</b> ${paymentBadge}
📦 <b>Type:</b> ${orderTypeBadge}
━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Customer:</b> <b>${customer}</b>
📞 <b>Phone:</b> <code>${phone}</code>
📍 <b>${order.orderType === 'delivery' ? 'Delivery Address' : 'Dine-in / Table'}:</b>
<i>${address}</i>
━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <b>ITEMS TO PREPARE (${totalQty} item${totalQty === 1 ? '' : 's'}):</b>
${items}${notes}${coupon}
━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Received At:</b> ${timeFormatted}
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