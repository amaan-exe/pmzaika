import { COLLECTIONS, getDb } from '@/lib/db';
import type { Doc } from '@/lib/db/types';

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no_show';

export interface Reservation extends Record<string, unknown> {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  seating: string;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export class ReservationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'ReservationError';
  }
}

const collection = async () => (await getDb()).collection<Reservation>(COLLECTIONS.reservations);

export async function createReservation(input: {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  seating?: string;
  notes?: string;
}): Promise<Reservation> {
  const reservations = await collection();
  const now = new Date().toISOString();

  const reservation: Reservation = {
    id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    date: input.date,
    time: input.time,
    guests: input.guests,
    seating: input.seating?.trim() || '',
    notes: input.notes?.trim() || '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await reservations.set(reservation.id, reservation);
  return reservation;
}

export async function listReservations(filter: {
  status?: ReservationStatus[];
  date?: string;
  search?: string;
  limit?: number;
} = {}): Promise<{ reservations: Reservation[]; total: number }> {
  const db = await getDb();
  const { docs } = await db.collection<Reservation>(COLLECTIONS.reservations).list({
    filters: [
      ...(filter.status?.length
        ? [{ field: 'status', op: 'in' as const, value: filter.status }]
        : []),
      ...(filter.date ? [{ field: 'date', op: '==' as const, value: filter.date }] : []),
    ],
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    limit: filter.limit ?? 100,
  });

  let reservations = docs;

  if (filter.search) {
    const needle = filter.search.trim().toLowerCase();
    reservations = reservations.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.phone.includes(needle) ||
        r.email.toLowerCase().includes(needle),
    );
  }

  return { reservations, total: reservations.length };
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  actor: string
): Promise<Reservation> {
  const reservations = await collection();
  const updated = await reservations.update(id, (current) => ({
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  }));

  if (!updated) throw new ReservationError('Reservation not found', 404);
  return updated;
}

export async function deleteReservation(id: string): Promise<void> {
  const reservations = await collection();
  const existing = await reservations.get(id);
  if (!existing) throw new ReservationError('Reservation not found', 404);
  await reservations.delete(id);
}