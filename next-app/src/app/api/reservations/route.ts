import type { NextRequest } from 'next/server';

import { clientIp, json, rateLimit, readJson, withErrorHandling } from '@/lib/http/api';
import { createReservation } from '@/lib/reservations/service';
import { createReservationSchema } from '@/lib/reservations/schema';

export const runtime = 'nodejs';

/** Public reservation creation — called by the /reservation page. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { limited, retryAfterSeconds } = rateLimit(
    `reservation:${clientIp(request)}`,
    10,
    10 * 60 * 1000,
  );

  if (limited) {
    return json(
      { ok: false, error: 'Too many reservation attempts. Please call the restaurant.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const payload = createReservationSchema.parse(await readJson(request));
  const reservation = await createReservation(payload);

  return json({ ok: true, reservation }, { status: 201 });
});