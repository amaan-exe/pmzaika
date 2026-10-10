import type { NextRequest } from 'next/server';

import { json, withErrorHandling } from '@/lib/http/api';
import { listCategories, listMenu } from '@/lib/menu/service';

export const runtime = 'nodejs';

/** Live menu. Prices come from the database so admin edits apply immediately. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;

  const [items, categories] = await Promise.all([
    listMenu({
      includeUnavailable: params.get('includeUnavailable') === 'true',
      category: params.get('category') ?? undefined,
    }),
    listCategories(),
  ]);

  return json({ ok: true, count: items.length, categories, items });
});