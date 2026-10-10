import type { Order, OrderStatus } from '@/lib/domain/types';
import { RESTAURANT } from '@/lib/env';
import { formatRupees } from '@/lib/orders/pricing';
import { orderTrackingUrl } from '@/lib/orders/links';
import { ORDER_STATUS_FLOW } from '@/lib/orders/status';

/**
 * Converts a stored phone number into the international form wa.me expects.
 *
 * Customer phones are normalised to a bare 10-digit Indian mobile number, so the
 * `91` country code has to be restored before building the deep link.
 */
export function toWhatsappNumber(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  return digits;
}

export function whatsappUrl(phone: string, message: string): string {
  const number = toWhatsappNumber(phone);
  if (!number) return `https://wa.me/?text=${encodeURIComponent(message)}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const divider = '━━━━━━━━━━━━━━━━━━━━━';

function itemLines(order: Order): string {
  return order.items
    .map(
      (item, index) =>
        `${index + 1}. *${item.title}*\n   Qty: ${item.qty} × ${formatRupees(
          item.pricePaise
        )} = *${formatRupees(item.lineTotalPaise)}*`
    )
    .join('\n');
}

function customerBlock(order: Order): string {
  const lines = [
    `👤 *Name:* ${order.customerName}`,
    `📞 *Phone:* +91${order.customerPhone}`,
  ];

  if (order.orderType === 'delivery' && order.deliveryAddress) {
    lines.push(`📍 *Address:* ${order.deliveryAddress}`);
  }
  if (order.orderType === 'dinein' && order.seatingNote) {
    lines.push(`🪑 *Seating:* ${order.seatingNote}`);
  }

  return lines.join('\n');
}

function totalsBlock(order: Order): string {
  const lines = [`💰 *Items Subtotal:* ${formatRupees(order.totals.subtotalPaise)}`];

  if (order.totals.discountPaise > 0 && order.appliedCoupon) {
    lines.push(
      `🎁 *Coupon ${order.appliedCoupon}:* − ${formatRupees(order.totals.discountPaise)}`
    );
  }
  if (order.totals.taxPaise > 0) {
    lines.push(`🧾 *GST:* ${formatRupees(order.totals.taxPaise)}`);
  }
  lines.push(
    order.totals.deliveryChargePaise > 0
      ? `🛵 *Delivery Fee:* ${formatRupees(order.totals.deliveryChargePaise)}`
      : `🛵 *Delivery Fee:* FREE 🎉`
  );
  lines.push(`📦 *Packaging:* FREE`);
  lines.push(divider);
  lines.push(`💵 *TOTAL TO PAY: ${formatRupees(order.totals.grandTotalPaise)}*`);
  lines.push(`🏦 *UPI VPA:* ${order.upi.vpa}`);

  return lines.join('\n');
}

/** Message sent to the restaurant the moment a new order lands. */
export function buildKitchenNotification(order: Order): string {
  const sections = [
    `🔔 *NEW ORDER RECEIVED - ${RESTAURANT.name}*`,
    divider,
    `🧾 *Order ID:* ${order.orderId}`,
    `📋 *Type:* ${order.orderType === 'delivery' ? '🛵 Home Delivery' : '🍽️ Dine-in'}`,
    `💳 *Payment:* ${order.customerMarkedPaid ? 'Customer says PAID - verify the UTR' : 'Not marked as paid'}`,
    divider,
    customerBlock(order),
    divider,
    '*ITEMS*',
    itemLines(order),
    divider,
    totalsBlock(order),
  ];

  if (order.notes) sections.push(`📝 *Chef Note:* ${order.notes}`);
  sections.push(divider);

  return sections.join('\n');
}

/**
 * The message the customer sends back after paying.
 *
 * It restates the whole order and asks for the payment screenshot, so the proof
 * and the order details stay in a single WhatsApp thread.
 */
export function buildPaymentProofRequest(order: Order): string {
  const sections = [
    `💳 *PAYMENT PROOF - ${order.orderId}*`,
    divider,
    customerBlock(order),
    divider,
    '*ITEMS*',
    itemLines(order),
    divider,
    totalsBlock(order),
    divider,
    `✅ *I have paid ${formatRupees(order.totals.grandTotalPaise)} via UPI to ${
      order.upi.vpa
    }.*`,
    order.transactionReference
      ? `🔢 *UTR / Transaction ID:* ${order.transactionReference}`
      : '',
    `📎 *Please find my payment screenshot attached.*`,
    divider,
    `Kindly verify my payment and start preparing my order. Thank you! 🙏`,
    RESTAURANT.name,
  ];

  return sections.filter(Boolean).join('\n');
}

/** Confirmation the customer receives once an admin verifies the payment. */
export function buildPaymentVerifiedMessage(order: Order): string {
  return [
    `✅ *PAYMENT VERIFIED - ${order.orderId}*`,
    divider,
    `Thank you ${order.customerName}! We received your payment of ${formatRupees(
      order.totals.grandTotalPaise
    )}.`,
    `👨‍🍳 Your order is confirmed and will be freshly prepared.`,
    `Track it live: ${orderTrackingUrl(order)}`,
  ].join('\n');
}

/** Progress update sent on every status transition. */
export function buildStatusUpdateMessage(order: Order, status: OrderStatus): string {
  const meta = ORDER_STATUS_FLOW[status];
  return [
    `🔔 *ORDER UPDATE - ${order.orderId}*`,
    divider,
    `*Status:* ${meta.label}`,
    `📝 ${meta.description}`,
    divider,
    `💵 Total: ${formatRupees(order.totals.grandTotalPaise)}`,
    `Track live: ${orderTrackingUrl(order)}`,
    RESTAURANT.name,
  ].join('\n');
}

export function buildCancellationMessage(order: Order, reason?: string): string {
  return [
    `⚠️ *ORDER CANCELLED - ${order.orderId}*`,
    divider,
    `We are sorry, but your order could not be completed.`,
    reason ? `📝 *Reason:* ${reason}` : '',
    `💵 If you already paid, your amount will be refunded shortly.`,
    `Please contact us on +91 ${RESTAURANT.whatsapp} for help.`,
  ]
    .filter(Boolean)
    .join('\n');
}

export const kitchenWhatsAppUrl = (order: Order): string =>
  whatsappUrl(RESTAURANT.whatsapp, buildKitchenNotification(order));

export const paymentProofWhatsAppUrl = (order: Order): string =>
  whatsappUrl(order.customerPhone, buildPaymentProofRequest(order));