'use client';

import React, { useMemo, useState } from 'react';

import { fetchAdminReservations, updateReservationStatus, deleteReservation } from '@/lib/client/adminApi';
import type { AdminReservation, ReservationStatus } from '@/lib/admin/types';
import {
  Alert,
  EmptyState,
  Loading,
  PageHeader,
  rupees,
  timeAgo,
} from '@/components/admin/ui';
import { useAsyncData, usePolling } from '@/components/admin/useAsyncData';

type Tab = 'pending' | 'confirmed' | 'all' | 'cancelled';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'all', label: 'All' },
  { id: 'cancelled', label: 'Cancelled' },
];

const REFRESH_MS = 60_000;

const STATUS_ACTIONS: Record<string, Array<{ status: ReservationStatus; label: string; tone: string }>> = {
  pending: [
    { status: 'confirmed', label: 'Confirm', tone: 'admin-btn--primary' },
    { status: 'cancelled', label: 'Cancel', tone: 'admin-btn--danger' },
  ],
  confirmed: [
    { status: 'seated', label: 'Seat guest', tone: 'admin-btn--green' },
    { status: 'no_show', label: 'No-show', tone: 'admin-btn--danger' },
    { status: 'cancelled', label: 'Cancel', tone: 'admin-btn--danger' },
  ],
  seated: [],
  cancelled: [],
  no_show: [],
};

const STATUS_PILL: Record<ReservationStatus, string> = {
  pending: 'pending',
  confirmed: 'active',
  seated: 'success',
  cancelled: 'danger',
  no_show: 'muted',
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  seated: 'Seated',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export default function AdminReservationsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, error, loading, reload } = useAsyncData(
    () =>
      fetchAdminReservations({
        status: tab === 'all' ? undefined : tab === 'cancelled' ? 'cancelled,no_show' : tab,
        search: search.trim() || undefined,
        limit: 100,
      }),
    [tab, search],
  );

  usePolling(reload, REFRESH_MS);

  const reservations = data?.reservations ?? [];

  const handleStatus = async (reservation: AdminReservation, status: ReservationStatus) => {
    setBusyId(reservation.id);
    setNotice(null);
    try {
      await updateReservationStatus(reservation.id, status);
      setNotice(`${reservation.name} → ${STATUS_LABEL[status]}`);
      reload();
    } catch (caught) {
      setNotice(null);
      throw caught;
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (reservation: AdminReservation) => {
    if (!window.confirm(`Delete the reservation for ${reservation.name}?`)) return;
    setBusyId(reservation.id);
    setNotice(null);
    try {
      await deleteReservation(reservation.id);
      setNotice(`${reservation.name}'s reservation deleted.`);
      reload();
    } catch (caught) {
      setNotice(null);
      throw caught;
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const pending = reservations.filter((r) => r.status === 'pending').length;
    const confirmed = reservations.filter((r) => r.status === 'confirmed').length;
    return { total: reservations.length, pending, confirmed };
  }, [reservations]);

  return (
    <>
      <PageHeader
        title="Reservations"
        subtitle={
          loading
            ? 'Loading…'
            : `${counts.total} reservation${counts.total === 1 ? '' : 's'} · ${counts.pending} pending · ${counts.confirmed} confirmed`
        }
        actions={
          <button type="button" className="admin-btn admin-btn--sm" onClick={reload}>
            Refresh
          </button>
        }
      />

      <div className="admin-toolbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-filter-pill ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
        <input
          className="admin-input admin-search"
          type="search"
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      {loading ? (
        <Loading label="Loading reservations…" />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No reservations here"
          hint={
            tab === 'pending'
              ? 'New reservations will appear the moment a customer books a table.'
              : 'No reservations match this filter.'
          }
        />
      ) : (
        <div className="admin-orders-grid">
          {reservations.map((reservation) => {
            const busy = busyId === reservation.id;
            const actions = STATUS_ACTIONS[reservation.status] ?? [];
            return (
              <article className="order-card" key={reservation.id}>
                <div className="order-card-head">
                  <div>
                    <div className="order-card-id">{reservation.name}</div>
                    <div className="order-card-time">
                      {reservation.date} at {reservation.time} · {reservation.guests} guest
                      {reservation.guests === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className={`admin-pill admin-pill--${STATUS_PILL[reservation.status]}`}>
                    {STATUS_LABEL[reservation.status]}
                  </span>
                </div>

                <div>
                  <div className="order-card-customer">
                    <a href={`tel:${reservation.phone}`} style={{ color: 'var(--admin-amber)' }}>
                      {reservation.phone}
                    </a>
                  </div>
                  <div className="order-card-meta">
                    {reservation.email}
                    {reservation.seating && ` · ${reservation.seating}`}
                  </div>
                </div>

                {reservation.notes && (
                  <div className="order-card-meta">
                    <strong style={{ color: 'var(--admin-text)' }}>Notes:</strong> {reservation.notes}
                  </div>
                )}

                <div className="order-card-foot">
                  <span className="order-card-time">Booked {timeAgo(reservation.createdAt)}</span>
                  <div className="order-actions">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        disabled={busy}
                        onClick={() => void handleStatus(reservation, action.status)}
                        className={`admin-btn admin-btn--sm ${action.tone}`}
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--danger"
                      disabled={busy}
                      onClick={() => void handleDelete(reservation)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}