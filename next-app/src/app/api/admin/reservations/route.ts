import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { listReservations } from '@/lib/reservations/service';
import { listReservationsQuerySchema } from '@/lib/reservations/schema';
import type { ReservationStatus } from '@/lib/reservations/service';

export const runtime = 'nodejs';

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/** Admin reservation list with status, date and search filters. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const query = listReservationsQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  const { reservations, total } = await listReservations({
    status: query.status ? (splitList(query.status) as ReservationStatus[]) : undefined,
    date: query.date,
    search: query.search,
    limit: query.limit ?? 100,
  });

  return json({ ok: true, total, reservations });
});