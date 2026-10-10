import type { Order, RestaurantSettings } from '@/lib/domain/types';
import { upiAmount } from '@/lib/orders/pricing';

/**
 * Builds a standard UPI intent (`upi://pay?...`) for the QR the customer scans.
 * The transaction reference is the order id, so the kitchen can match the credit
 * entry in their UPI app.
 */
export function buildUpiIntent(params: {
  amountPaise: number;
  orderId: string;
  payeeName: string;
  vpa: string;
  note?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: upiAmount(params.amountPaise),
    cu: 'INR',
    tr: params.orderId,
    tn: params.note ?? `Order ${params.orderId}`,
  });

  return `upi://pay?${query.toString()}`;
}

export function buildOrderUpi(
  orderId: string,
  amountPaise: number,
  customerName: string,
  settings: RestaurantSettings
): Order['upi'] {
  return {
    vpa: settings.storeUpiId,
    payeeName: settings.storeUpiName,
    amountPaise,
    intent: buildUpiIntent({
      amountPaise,
      orderId,
      payeeName: settings.storeUpiName,
      vpa: settings.storeUpiId,
      note: `Order ${orderId} - ${customerName}`,
    }),
  };
}

/** One-click launch links for the common UPI apps. */
export function upiAppLinks(intent: string): Array<{ label: string; href: string }> {
  return [
    { label: 'Google Pay', href: `https://pay.google.com/gp/pay?upi_link=${encodeURIComponent(intent)}` },
    { label: 'PhonePe', href: `phonepe://pay?pa=${encodeURIComponent(intent.split('?')[1] ?? '')}` },
    { label: 'Paytm', href: `paytmmp://pay?pa=${encodeURIComponent(intent.split('?')[1] ?? '')}` },
    { label: 'Any UPI app', href: intent },
  ];
}