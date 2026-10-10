import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { couponSchema } from '@/lib/orders/schema';
import { createCoupon, listCoupons } from '@/lib/coupons/service';

export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const search = request.nextUrl.searchParams.get('search')?.toLowerCase() ?? '';
  const coupons = await listCoupons();
  const filtered = search
    ? coupons.filter(
        (coupon) =>
          coupon.couponCode.toLowerCase().includes(search) ||
          coupon.applicableCategory.toLowerCase().includes(search)
      )
    : coupons;

  return json({ ok: true, count: filtered.length, coupons: filtered });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);
  const payload = couponSchema.parse(await readJson(request));

  const coupon = await createCoupon(payload);
  return json({ ok: true, coupon }, { status: 201 });
});