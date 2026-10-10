import type { NextRequest } from 'next/server';

import { optionalCustomer } from '@/lib/auth/user';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { validateCouponSchema } from '@/lib/orders/schema';
import { validateCoupon } from '@/lib/coupons/service';

export const runtime = 'nodejs';

/**
 * Coupon preview for the cart. Used for the optimistic UI hint only – the same
 * rules are re-evaluated server-side when the order is actually created.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const payload = validateCouponSchema.parse(await readJson(request));
  const session = await optionalCustomer(request);

  const result = await validateCoupon(payload.couponCode, {
    subtotalPaise: payload.subtotalPaise,
    categories: payload.categories,
    userKey: payload.userKey ?? session?.uid,
  });

  return json({
    ok: true,
    valid: result.valid,
    reason: result.reason,
    discountPaise: result.discountPaise,
    coupon: result.coupon
      ? {
          code: result.coupon.couponCode,
          description: result.coupon.description,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
        }
      : null,
  });
});