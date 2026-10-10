import type { Order } from '@/lib/domain/types';
import { RESTAURANT } from '@/lib/env';
import { formatRupees } from '@/lib/orders/pricing';

/** Escapes the characters Telegram's HTML parse mode treats as markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function orderSummaryHtml(order: Order): string {
  const customer = escapeHtml(order.customerName || 'Guest');
  const phone = escapeHtml(order.customerPhone || 'Not provided');
  const address = escapeHtml(
    order.orderType === 'delivery'
      ? order.deliveryAddress || 'Pickup / Direct Order'
      : order.seatingNote || 'Walk-in'
  );

  const items = order.items.length
    ? order.items
        .map(
          (item) =>
            `   • ${escapeHtml(item.title)} × ${item.qty} (${formatRupees(
              item.lineTotalPaise
            )})`
        )
        .join('\n')
    : '   • Order items unavailable';

  const coupon = order.appliedCoupon
    ? `\n🎁 <b>Coupon:</b> ${escapeHtml(order.appliedCoupon)} (− ${formatRupees(
        order.totals.discountPaise
      )})`
    : '';

  return `
🍗 <b>NEW ORDER - ${escapeHtml(RESTAURANT.name)}</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${escapeHtml(order.orderId)}</code>
💰 <b>Total:</b> ${formatRupees(order.totals.grandTotalPaise)}
💳 <b>Payment:</b> ${escapeHtml(order.paymentStatus.replace(/_/g, ' '))}
👤 <b>Customer:</b> ${customer}
📞 <b>Phone:</b> <code>${phone}</code>
📍 <b>${order.orderType === 'delivery' ? 'Address' : 'Seating'}:</b> ${address}

📦 <b>Order Items:</b>
${items}
${order.notes ? `\n📝 <b>Chef Note:</b> ${escapeHtml(order.notes)}` : ''}${coupon}

⏰ <b>Time:</b> ${new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })}
━━━━━━━━━━━━━━━━━━
`.trim();
}

interface TelegramResult {
  success: boolean;
  reason?: string;
  messageId?: number;
}

/**
 * Free, instant order alerts to the kitchen's Telegram group.
 *
 * Mirrors the reference implementation: silently no-ops when the bot credentials
 * are absent so notification problems can never block an order.
 */
export async function sendTelegramOrderNotification(
  order: Order
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, reason: 'Telegram credentials not configured' };
  }

  return sendTelegramMessage(orderSummaryHtml(order));
}

export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, reason: 'Telegram credentials not configured' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };

    if (!response.ok || !payload.ok) {
      return {
        success: false,
        reason: payload.description ?? response.statusText,
      };
    }

    return { success: true, messageId: payload.result?.message_id };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown Telegram error',
    };
  }
}