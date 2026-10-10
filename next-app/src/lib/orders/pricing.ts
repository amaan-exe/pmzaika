import type { OrderTotals, OrderType, RestaurantSettings } from '@/lib/domain/types';

export const paiseToRupees = (paise: number): number => paise / 100;

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

export function formatRupees(paise: number): string {
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise))}`;
}

/** UPI payloads require a fixed two-decimal amount. */
export const upiAmount = (paise: number): string => (paise / 100).toFixed(2);

export interface PricingInput {
  lines: Array<{ pricePaise: number; qty: number }>;
  orderType: OrderType;
  settings: RestaurantSettings;
  /** Already server-verified discount, in paise. */
  discountPaise?: number;
}

/**
 * Single source of truth for money. Driven entirely by the admin-editable
 * restaurant settings so pricing changes never require a deploy.
 */
export function computeTotals({
  lines,
  orderType,
  settings,
  discountPaise = 0,
}: PricingInput): OrderTotals {
  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.pricePaise * line.qty,
    0
  );

  const cappedDiscountPaise = Math.max(0, Math.min(discountPaise, subtotalPaise));
  const afterDiscountPaise = subtotalPaise - cappedDiscountPaise;

  // GST is only added when the admin has configured a non-zero percentage.
  // Otherwise menu prices are treated as inclusive and tax stays informational.
  const gstPercentage = Number(settings.gstPercentage) || 0;
  const taxPaise =
    gstPercentage > 0 ? Math.round((afterDiscountPaise * gstPercentage) / 100) : 0;

  const qualifiesForFreeDelivery =
    orderType === 'delivery' && subtotalPaise >= (settings.freeDeliveryAbovePaise ?? 0);

  const deliveryChargePaise =
    orderType === 'delivery' && !qualifiesForFreeDelivery
      ? (settings.deliveryChargePaise ?? 0)
      : 0;

  const grandTotalPaise = afterDiscountPaise + taxPaise + deliveryChargePaise;

  return {
    subtotalPaise,
    deliveryChargePaise,
    taxPaise,
    discountPaise: cappedDiscountPaise,
    grandTotalPaise: Math.max(0, grandTotalPaise),
  };
}

/** Rupee amount formatted for the UPI spec. */
export function deliveryProgress(
  subtotalPaise: number,
  settings: RestaurantSettings
): { qualified: boolean; remainingPaise: number; thresholdPaise: number } {
  const thresholdPaise = settings.freeDeliveryAbovePaise ?? 0;
  return {
    qualified: subtotalPaise >= thresholdPaise,
    remainingPaise: Math.max(0, thresholdPaise - subtotalPaise),
    thresholdPaise,
  };
}