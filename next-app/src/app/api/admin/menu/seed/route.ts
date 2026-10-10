import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { SEED_MENU_SIZE } from '@/lib/menu/seed';
import { invalidateMenuSeedCache, seedMenu } from '@/lib/menu/service';

export const runtime = 'nodejs';

/**
 * Re-seeds the menu from the restaurant's own menu sheet.
 *
 * Destructive for existing dishes: ids are reused, so any admin price edits are
 * overwritten. Intended for a deliberate re-sync, not a routine action.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const items = await seedMenu();
  // A deliberate re-seed must not be undone by the memoised seed check.
  invalidateMenuSeedCache();

  return json({
    ok: true,
    seeded: items.length,
    sourceSize: SEED_MENU_SIZE,
  });
});