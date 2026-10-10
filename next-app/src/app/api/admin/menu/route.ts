import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { menuItemSchema } from '@/lib/orders/schema';
import { createMenuItem, listCategories, listMenu } from '@/lib/menu/service';

export const runtime = 'nodejs';

/** Full menu including unavailable dishes, for the management desk. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const category = request.nextUrl.searchParams.get('category') ?? undefined;
  const [items, categories] = await Promise.all([
    listMenu({ includeUnavailable: true, category }),
    listCategories(),
  ]);

  return json({ ok: true, count: items.length, categories, items });
});

/** Adds a dish to the catalogue. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAdmin(request);
  const payload = menuItemSchema.parse(await readJson(request));

  const item = await createMenuItem(payload, `admin:${session.uid}`);
  return json({ ok: true, item }, { status: 201 });
});