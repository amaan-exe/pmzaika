import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { sendTelegramMessage } from '@/lib/notifications/telegram';
import { isWebPushConfigured } from '@/lib/notifications/webpush';
import { z } from 'zod';

export const runtime = 'nodejs';

const testSchema = z.object({
  channel: z.enum(['telegram', 'webpush', 'all']).default('telegram'),
  message: z.string().trim().max(500).optional(),
});

/** Sends a test alert so the team can verify notification setup. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);
  const { channel, message } = testSchema.parse(await request.json());

  const results: Record<string, unknown> = {};

  if (channel === 'telegram' || channel === 'all') {
    results.telegram = await sendTelegramMessage(
      message ?? '✅ PM Zaika notification test. Kitchen alerts are working.'
    );
  }

  if (channel === 'webpush' || channel === 'all') {
    const { sendPushNotification } = await import('@/lib/notifications/webpush');
    results.webpush = await sendPushNotification({
      title: 'PM Zaika test alert',
      body: message ?? 'Push notifications are working.',
      tag: 'pm-zaika-test',
    });
    results.webpushConfigured = isWebPushConfigured();
  }

  return json({ ok: true, results });
});