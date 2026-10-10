import { COLLECTIONS, getDb } from '@/lib/db';
import type { Doc } from '@/lib/db/types';
import type { Coupon } from '@/lib/domain/types';

export class CouponError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = 'CouponError';
  }
}

const collection = async () => (await getDb()).collection<Coupon>(COLLECTIONS.coupons);

const normaliseCode = (code: string): string => code.trim().toUpperCase();

export async function listCoupons(): Promise<Coupon[]> {
  const { docs } = await (await collection()).list({
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
  });
  return docs;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  return (await collection()).findOne('couponCode', normaliseCode(code));
}

export interface CouponInput {
  couponCode: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minimumOrderPaise: number;
  usageLimit: number;
  perUserLimit: number;
  applicableCategory: string;
  expiryDate: string;
  active: boolean;
  stackable: boolean;
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const coupons = await collection();
  const couponCode = normaliseCode(input.couponCode);

  if (!couponCode) throw new CouponError('Coupon code is required');
  if (await coupons.findOne('couponCode', couponCode)) {
    throw new CouponError(`Coupon "${couponCode}" already exists`, 409);
  }

  const now = new Date().toISOString();
  const coupon: Coupon = {
    id: couponCode.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    couponCode,
    description: input.description?.trim() ?? '',
    discountType: input.discountType,
    discountValue: Math.max(0, Number(input.discountValue) || 0),
    minimumOrderPaise: Math.max(0, Number(input.minimumOrderPaise) || 0),
    usageLimit: Math.max(0, Number(input.usageLimit) || 0),
    usedCount: 0,
    perUserLimit: Math.max(1, Number(input.perUserLimit) || 1),
    usedByUsers: {},
    applicableCategory: input.applicableCategory || 'all',
    expiryDate: input.expiryDate || '',
    active: input.active,
    stackable: input.stackable ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await coupons.set(coupon.id, coupon);
  return coupon;
}

export async function updateCoupon(id: string, patch: Partial<CouponInput>): Promise<Coupon> {
  const coupons = await collection();
  const updated = await coupons.update(id, (current) => ({
    ...current,
    ...patch,
    couponCode: patch.couponCode ? normaliseCode(patch.couponCode) : current.couponCode,
    id: current.id,
    updatedAt: new Date().toISOString(),
  }));

  if (!updated) throw new CouponError('Coupon not found', 404);
  return updated;
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupons = await collection();
  const existing = await coupons.get(id);
  if (!existing) throw new CouponError('Coupon not found', 404);
  await coupons.delete(id);
}

export interface ValidationContext {
  /** Order subtotal in paise, before discount and delivery. */
  subtotalPaise: number;
  categories: string[];
  /** Firebase uid or guest identifier, used for the per-user limit. */
  userKey?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason: string | null;
  discountPaise: number;
  coupon: Coupon | null;
}

/**
 * Server-side coupon rule engine.
 *
 * Mirrors the reference implementation's six rules, but works in paise and never
 * trusts a discount amount supplied by the client.
 */
export async function validateCoupon(
  code: string,
  context: ValidationContext
): Promise<ValidationResult> {
  const cleanCode = normaliseCode(code);

  if (!cleanCode) {
    return { valid: false, reason: null, discountPaise: 0, coupon: null };
  }

  const coupon = await getCouponByCode(cleanCode);
  if (!coupon) {
    return { valid: false, reason: 'Invalid coupon code', discountPaise: 0, coupon: null };
  }

  // Rule 1: active
  if (!coupon.active) {
    return { valid: false, reason: 'This coupon is no longer active', discountPaise: 0, coupon };
  }

  // Rule 2: expiry
  if (coupon.expiryDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (today > coupon.expiryDate) {
      return {
        valid: false,
        reason: `This coupon expired on ${coupon.expiryDate}`,
        discountPaise: 0,
        coupon,
      };
    }
  }

  // Rule 3: global usage limit (0 = unlimited)
  if (coupon.usageLimit > 0 && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
    return {
      valid: false,
      reason: 'This coupon has reached its redemption limit',
      discountPaise: 0,
      coupon,
    };
  }

  // Rule 4: minimum order threshold
  if (context.subtotalPaise < (coupon.minimumOrderPaise ?? 0)) {
    return {
      valid: false,
      reason: `Minimum order of ₹${(coupon.minimumOrderPaise ?? 0) / 100} required for this coupon`,
      discountPaise: 0,
      coupon,
    };
  }

  // Rule 5: per-user limit
  if (context.userKey && coupon.perUserLimit > 0) {
    const used = (coupon.usedByUsers ?? {})[context.userKey] ?? 0;
    if (used >= coupon.perUserLimit) {
      return {
        valid: false,
        reason: 'You have already used this coupon',
        discountPaise: 0,
        coupon,
      };
    }
  }

  // Rule 6: category restriction
  if (coupon.applicableCategory && coupon.applicableCategory !== 'all') {
    const matches = context.categories.some(
      (category) => category.toLowerCase() === coupon.applicableCategory.toLowerCase()
    );
    if (!matches) {
      return {
        valid: false,
        reason: `This coupon is only valid on ${coupon.applicableCategory} items`,
        discountPaise: 0,
        coupon,
      };
    }
  }

  const rawDiscount =
    coupon.discountType === 'percent'
      ? Math.round((context.subtotalPaise * coupon.discountValue) / 100)
      : Math.round(coupon.discountValue * 100);

  // Never discount below zero, and never past the subtotal itself.
  const discountPaise = Math.max(0, Math.min(rawDiscount, context.subtotalPaise));

  return { valid: true, reason: null, discountPaise, coupon };
}

/**
 * Records a redemption. Runs inside a transaction so concurrent checkouts cannot
 * exceed the global usage limit.
 */
export async function trackCouponUsage(
  code: string,
  userKey?: string
): Promise<boolean> {
  const coupons = await collection();
  const coupon = await getCouponByCode(code);
  if (!coupon) return false;

  const updated = await coupons.update(coupon.id, (current) => {
    if (current.usageLimit > 0 && (current.usedCount ?? 0) >= current.usageLimit) {
      return null; // Lost the race – do not record an over-limit redemption.
    }

    const usedByUsers: Record<string, number> = { ...(current.usedByUsers ?? {}) };
    if (userKey) {
      usedByUsers[userKey] = (usedByUsers[userKey] ?? 0) + 1;
    }

    return {
      ...current,
      usedCount: (current.usedCount ?? 0) + 1,
      usedByUsers,
      updatedAt: new Date().toISOString(),
    };
  });

  return updated !== null;
}

/** Recomputes how often each coupon appears across the order history. */
export async function couponUsageFromOrders(): Promise<Record<string, number>> {
  const db = await getDb();
  const usage: Record<string, number> = {};

  for (const name of [COLLECTIONS.orders, COLLECTIONS.orderArchive]) {
    const { docs } = await db.collection<Doc>(name).list();
    for (const order of docs) {
      const code = (order.appliedCoupon as string | null) ?? null;
      if (code) usage[code] = (usage[code] ?? 0) + 1;
    }
  }

  return usage;
}