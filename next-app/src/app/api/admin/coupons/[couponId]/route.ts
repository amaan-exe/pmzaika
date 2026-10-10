import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { couponSchema } from '@/lib/orders/schema';
import { deleteCoupon, updateCoupon } from '@/lib/coupons/service';

export const runtime = 'nodejs';

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ couponId: string }> }) => {
    await requireAdmin(request);
    const { couponId } = await params;
    const payload = couponSchema.partial().parse(await readJson(request));

    const coupon = await updateCoupon(couponId, payload);
    return json({ ok: true, coupon });
  }
);

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ couponId: string }> }) => {
    await requireAdmin(request);
    const { couponId } = await params;

    await deleteCoupon(couponId);
    return json({ ok: true });
  }
);