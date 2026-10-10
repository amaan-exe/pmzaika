import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { settingsSchema } from '@/lib/orders/schema';
import { getSettings, updateSettings } from '@/lib/settings/service';

export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);
  return json({ ok: true, settings: await getSettings() });
});

/** Saves store operations, pricing rules and the announcement banner. */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAdmin(request);
  const payload = settingsSchema.parse(await readJson(request));

  const settings = await updateSettings(payload, `admin:${session.uid}`);
  return json({ ok: true, settings });
});