import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { listWebhookLogs } from '@/lib/notifications/dispatcher';

export const runtime = 'nodejs';

/** Per-channel delivery log for Telegram, Web Push and the outbound webhook. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const logs = await listWebhookLogs(
    Number(request.nextUrl.searchParams.get('limit') ?? 100)
  );

  return json({ ok: true, count: logs.length, logs });
});