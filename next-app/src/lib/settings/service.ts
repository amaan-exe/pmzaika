import { COLLECTIONS, getDb } from '@/lib/db';
import type { RestaurantSettings } from '@/lib/domain/types';
import { PRICING, RESTAURANT, UPI } from '@/lib/env';

/**
 * Defaults are used until an admin saves settings, and also act as the fallback
 * for any individual field that has never been configured.
 */
export function defaultSettings(): RestaurantSettings {
  return {
    id: 'restaurant',
    restaurantName: RESTAURANT.name,
    isStoreOpen: true,
    deliveryChargePaise: PRICING.deliveryFeePaise,
    freeDeliveryAbovePaise: PRICING.freeDeliveryAbovePaise,
    minimumOrderPaise: 0,
    // 0 means all menu prices already include GST.
    gstPercentage: 0,
    openingTime: '11:00 AM',
    closingTime: '11:30 PM',
    supportPhone: `+91 ${RESTAURANT.whatsapp}`,
    storeUpiId: UPI.vpa,
    storeUpiName: UPI.payeeName,
    restaurantAddress:
      'Shersha Road, Gur Ki Mandi, opposite Bank of India, Patna 800007, Bihar',
    announcement: { enabled: false, text: '', type: 'info' },
    autoCloseByTime: false,
    updatedAt: new Date().toISOString(),
  };
}

/** Settings change rarely, so a short cache keeps the checkout path cheap. */
const CACHE_TTL_MS = 10_000;
let cache: { value: RestaurantSettings; expiresAt: number } | null = null;

export async function getSettings(): Promise<RestaurantSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const db = await getDb();
  const doc = await db
    .collection<RestaurantSettings>(COLLECTIONS.settings)
    .get('restaurant');

  const value: RestaurantSettings = { ...defaultSettings(), ...(doc ?? {}) };
  // Guard against a partially written announcement sub-object.
  value.announcement = { ...defaultSettings().announcement, ...(doc?.announcement ?? {}) };

  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export function invalidateSettingsCache(): void {
  cache = null;
}

/** Announcement fields are merged individually so a partial save is safe. */
export type SettingsPatch = Omit<Partial<RestaurantSettings>, 'announcement'> & {
  announcement?: Partial<RestaurantSettings['announcement']>;
};

export async function updateSettings(
  patch: SettingsPatch,
  actor: string
): Promise<RestaurantSettings> {
  const db = await getDb();
  const collection = db.collection<RestaurantSettings>(COLLECTIONS.settings);
  const current = (await collection.get('restaurant')) ?? defaultSettings();

  const next: RestaurantSettings = {
    ...current,
    ...patch,
    id: 'restaurant',
    announcement: { ...current.announcement, ...(patch.announcement ?? {}) },
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };

  await collection.set('restaurant', next);
  invalidateSettingsCache();
  return next;
}

// ---------------------------------------------------------------------------
// Operating hours
// ---------------------------------------------------------------------------

/** Parses `11:00 AM` / `23:30` into minutes past midnight. */
export function parseTimeToMinutes(value: string): number | null {
  const match = value
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();

  if (!Number.isFinite(hours) || hours > 23 || minutes > 59) return null;

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/** True when `now` falls inside the configured delivery window. */
export function isWithinOpeningHours(
  settings: RestaurantSettings,
  now = new Date()
): boolean {
  if (!settings.autoCloseByTime) return true;

  const open = parseTimeToMinutes(settings.openingTime);
  const close = parseTimeToMinutes(settings.closingTime);
  if (open === null || close === null) return true;

  const current = now.getHours() * 60 + now.getMinutes();
  // A window that crosses midnight (e.g. 5 PM – 2 AM) is treated as one range.
  return open <= close
    ? current >= open && current <= close
    : current >= open || current <= close;
}

export interface StoreAvailability {
  acceptingOrders: boolean;
  /** Human readable reason shown when orders are blocked. */
  reason: string | null;
}

/** The "closed store shield" enforced on the server at order creation. */
export function storeAvailability(
  settings: RestaurantSettings,
  now = new Date()
): StoreAvailability {
  if (!settings.isStoreOpen) {
    return {
      acceptingOrders: false,
      reason:
        'Restaurant is currently closed for online orders. Please check back during operating hours.',
    };
  }

  if (!isWithinOpeningHours(settings, now)) {
    return {
      acceptingOrders: false,
      reason: `Online ordering is available between ${settings.openingTime} and ${settings.closingTime}.`,
    };
  }

  return { acceptingOrders: true, reason: null };
}