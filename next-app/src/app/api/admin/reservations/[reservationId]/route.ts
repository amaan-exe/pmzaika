import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { deleteReservation, updateReservationStatus } from '@/lib/reservations/service';
import { updateReservationSchema } from '@/lib/reservations/schema';
import type { ReservationStatus } from '@/lib/reservations/service';

export const runtime = 'nodejs';

/** Update a reservation's status (confirm, seat, cancel, mark no-show). */
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ reservationId: string }> }) => {
    const session = await requireAdmin(request);
    const { reservationId } = await params;
    const payload = updateReservationSchema.parse(await readJson(request));

    const reservation = await updateReservationStatus(
      reservationId,
      payload.status as ReservationStatus,
      `admin:${session.uid}`,
    );

    return json({ ok: true, reservation });
  },
);

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ reservationId: string }> }) => {
    await requireAdmin(request);
    const { reservationId } = await params;

    await deleteReservation(reservationId);
    return json({ ok: true });
  },
);