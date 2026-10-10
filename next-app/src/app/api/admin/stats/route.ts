import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { orderStats } from '@/lib/orders/service';
import { listCategories } from '@/lib/menu/service';

export const runtime = 'nodejs';

/** Revenue, volume and menu health summary for the dashboard header. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const params = request.nextUrl.searchParams;
  const [stats, categories] = await Promise.all([
    orderStats({ from: params.get('from') ?? undefined, to: params.get('to') ?? undefined }),
    listCategories(),
  ]);

  return json({
    ok: true,
    stats: {
      ...stats,
      totalDishes: categories.reduce((sum, category) => sum + category.count, 0),
      availableDishes: categories.reduce((sum, category) => sum + category.available, 0),
    },
    categories,
  });
});