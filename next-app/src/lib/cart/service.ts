import { COLLECTIONS, getDb } from '@/lib/db';
import type { Doc } from '@/lib/db/types';
import type { RestaurantSettings } from '@/lib/domain/types';
import { listMenu, resolveOrderLines } from '@/lib/menu/service';
import { computeTotals, deliveryProgress } from '@/lib/orders/pricing';
import { defaultSettings, getSettings } from '@/lib/settings/service';
import { PRICING } from '@/lib/env';
import { OrderError } from '@/lib/orders/service';

interface CartLineDoc extends Doc {
  id: string;
  sessionId: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  updatedAt: string;
}

export interface CartSnapshot {
  items: Array<{
    menuItemId: string;
    title: string;
    image: string;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
    vegNonVeg: 'veg' | 'non-veg';
    isAvailable: boolean;
  }>;
  totals: ReturnType<typeof computeTotals>;
  delivery: ReturnType<typeof deliveryProgress>;
  meetsMinimumOrder: boolean;
  updatedAt: string | null;
}

const carts = async () => (await getDb()).collection<CartLineDoc>(COLLECTIONS.carts);

function clampQuantity(quantity: number): number {
  return Math.max(0, Math.min(PRICING.maxQuantityPerItem, Math.floor(quantity)));
}

/**
 * Builds a display-ready cart from raw `{ menuItemId, quantity }` pairs.
 *
 * Prices always come from the live menu, and items that were removed or marked
 * unavailable are surfaced with `isAvailable: false` so the UI can grey them out
 * instead of silently changing the customer's total.
 */
export async function hydrateCart(
  items: Array<{ menuItemId: string; quantity: number }>,
  settings?: RestaurantSettings
): Promise<CartSnapshot> {
  // Fast-path: 0 database lookups when the cart is empty (e.g. initial visitor loads)
  if (!items || items.length === 0) {
    const resolved = settings ?? defaultSettings();
    const totals = computeTotals({
      lines: [],
      orderType: 'delivery',
      settings: resolved,
    });
    return {
      items: [],
      totals,
      delivery: deliveryProgress(0, resolved),
      meetsMinimumOrder: true,
      updatedAt: null,
    };
  }

  const resolved = settings ?? (await getSettings());

  const menu = await listMenu({ includeUnavailable: true });
  const byId = new Map(menu.map((item) => [item.id, item]));

  const merged = new Map<string, { menuItemId: string; quantity: number }>();
  for (const entry of items) {
    const existing = merged.get(entry.menuItemId);
    const quantity = clampQuantity(
      (existing?.quantity ?? 0) + entry.quantity
    );
    if (quantity > 0) merged.set(entry.menuItemId, { menuItemId: entry.menuItemId, quantity });
    else merged.delete(entry.menuItemId);
  }

  const lines = [...merged.values()].map((line) => {
    const item = byId.get(line.menuItemId);
    const unitPricePaise = item?.pricePaise ?? 0;
    return {
      menuItemId: line.menuItemId,
      title: item?.title ?? line.menuItemId,
      image: item?.image ?? '/assets/images/food_royal_biryani.jpg',
      unitPricePaise,
      quantity: line.quantity,
      lineTotalPaise: unitPricePaise * line.quantity,
      vegNonVeg: item?.vegNonVeg ?? ('non-veg' as const),
      isAvailable: item?.isAvailable ?? false,
    };
  });

  const orderable = lines.filter((line) => line.isAvailable);
  const totals = computeTotals({
    lines: orderable.map((line) => ({ pricePaise: line.unitPricePaise, qty: line.quantity })),
    orderType: 'delivery',
    settings: resolved,
  });

  return {
    items: lines,
    totals,
    delivery: deliveryProgress(totals.subtotalPaise, resolved),
    meetsMinimumOrder:
      (resolved.minimumOrderPaise ?? 0) === 0 ||
      totals.subtotalPaise >= (resolved.minimumOrderPaise ?? 0),
    updatedAt: null,
  };
}

export async function readCart(sessionId: string): Promise<CartSnapshot | null> {
  const doc = await (await carts()).get(sessionId);
  if (!doc) return null;

  const snapshot = await hydrateCart(doc.items ?? []);
  return { ...snapshot, updatedAt: doc.updatedAt };
}

/** Replaces the stored cart with the client state, normalised and clamped. */
export async function writeCart(
  sessionId: string,
  items: Array<{ menuItemId: string; quantity: number }>
): Promise<CartSnapshot> {
  const snapshot = await hydrateCart(items);
  const updatedAt = new Date().toISOString();

  await (await carts()).set(sessionId, {
    id: sessionId,
    sessionId,
    items: snapshot.items
      .filter((line) => line.quantity > 0)
      .map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
    updatedAt,
  });

  return { ...snapshot, updatedAt };
}

export async function clearCart(sessionId: string): Promise<void> {
  await (await carts()).delete(sessionId);
}

/**
 * Re-prices a client cart against the live menu before checkout.
 *
 * The browser never dictates prices, so this is the last chance to catch drift
 * between what the customer saw and what the kitchen will cook.
 */
export async function verifyCartForCheckout(
  items: Array<{ menuItemId: string; quantity: number }>
) {
  const { items: resolved, unavailable } = await resolveOrderLines(items);

  if (unavailable.length > 0) {
    throw new OrderError('Some items are no longer available', 422, {
      items: `Unavailable: ${unavailable.join(', ')}`,
    });
  }

  return resolved;
}

/** Guards against a client claiming a cart session that is not theirs. */
export function assertSessionOwnership(
  claimed: string | undefined,
  actual: string
): void {
  if (!claimed) return;
  if (claimed !== actual) {
    throw new OrderError('Invalid cart session', 403);
  }
}