import type { NextRequest } from 'next/server';

import { json, withErrorHandling } from '@/lib/http/api';
import { listCategories, listMenu } from '@/lib/menu/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300;

/** Live menu. Prices come from the database so admin edits apply immediately. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const includeUnavailable = searchParams.get('includeUnavailable') === 'true';
  const category = searchParams.get('category') ?? undefined;

  const allItems = await listMenu({ includeUnavailable: true });

  // Fast in-memory category derivation (0 extra reads, 0ms compute)
  const catMap = new Map<string, { id: string; name: string; count: number; available: number }>();
  for (const item of allItems) {
    const existing = catMap.get(item.category);
    if (existing) {
      existing.count += 1;
      if (item.isAvailable) existing.available += 1;
    } else {
      catMap.set(item.category, {
        id: item.category,
        name: item.categoryName,
        count: 1,
        available: item.isAvailable ? 1 : 0,
      });
    }
  }
  const categories = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  let items = allItems;
  if (!includeUnavailable) {
    items = items.filter((item) => item.isAvailable);
  }
  if (category && category !== 'all') {
    items = items.filter((item) => item.category === category);
  }

  return json(
    { ok: true, count: items.length, categories, items },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    }
  );
});