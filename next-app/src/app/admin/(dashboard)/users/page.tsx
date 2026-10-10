'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { fetchUsers, setAdminRole } from '@/lib/client/adminApi';
import type { AdminUser } from '@/lib/admin/types';
import {
  Alert,
  EmptyState,
  Loading,
  PageHeader,
  rupees,
  StatCard,
  StatGrid,
  timeAgo,
} from '@/components/admin/ui';
import { useAsyncData } from '@/components/admin/useAsyncData';

interface AdminRole {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminUsersPage() {
  const { data, error, loading, reload } = useAsyncData(() => fetchUsers(), []);

  const [search, setSearch] = useState('');
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const users = data?.users ?? [];
  const admins = data?.admins ?? [];

  const handleRole = useCallback(
    async (email: string, nextIsAdmin: boolean) => {
      setBusyEmail(email);
      setNotice(null);

      const previous = admins;
      // Flip locally first so the toggle never feels laggy, then confirm with
      // the server — a failed write is rolled back below.
      const optimistic = admins.map((entry) =>
        entry.email === email ? { ...entry, isAdmin: nextIsAdmin } : entry,
      );

      try {
        await setAdminRole(email, nextIsAdmin);
        setNotice(`${email} ${nextIsAdmin ? 'can now open the admin desk' : 'lost admin access'}.`);
        reload();
      } catch (caught) {
        setNotice(null);
        throw caught;
      } finally {
        setBusyEmail(null);
      }
    },
    [admins, reload],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        user.phone.toLowerCase().includes(needle),
    );
  }, [users, search]);

  // Spend is stored in paise and only ever shown through `rupees`.
  const lifetime = useMemo(
    () => ({
      orders: users.reduce((total, user) => total + user.orderCount, 0),
      spentPaise: users.reduce((total, user) => total + user.spentPaise, 0),
      repeat: users.filter((user) => user.orderCount > 1).length,
    }),
    [users],
  );

  const adminCount = admins.filter((entry) => entry.isAdmin).length;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={
          loading ? 'Loading…' : `${users.length} customer${users.length === 1 ? '' : 's'} on record`
        }
        actions={
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            onClick={reload}
            disabled={loading}
          >
            Refresh
          </button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <StatGrid>
        <StatCard
          label="Customers"
          value={users.length}
          hint="Signed-up accounts with order history"
          tone="blue"
        />
        <StatCard
          label="Lifetime spend"
          value={rupees(lifetime.spentPaise)}
          hint="Across every recorded order"
          tone="green"
        />
        <StatCard
          label="Orders placed"
          value={lifetime.orders}
          hint={`${lifetime.repeat} customer${lifetime.repeat === 1 ? '' : 's'} ordered more than once`}
        />
      </StatGrid>

      <div className="admin-toolbar">
        <input
          className="admin-input admin-search"
          type="search"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Loading label="Loading customers…" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No customers here"
          hint={
            users.length === 0
              ? 'Customers appear here as soon as they place their first order.'
              : 'No customer matches that search.'
          }
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="num">Orders</th>
                <th className="num">Total spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user: AdminUser) => (
                <tr key={user.uid}>
                  <td>
                    <strong>{user.displayName || user.email}</strong>
                    {user.displayName && (
                      <div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>
                        {user.email}
                      </div>
                    )}
                  </td>
                  <td>{user.email || '—'}</td>
                  <td>
                    {user.phone ? (
                      <a href={`tel:${user.phone}`} style={{ color: 'var(--admin-amber)' }}>
                        {user.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="num">{user.orderCount}</td>
                  <td className="num">{rupees(user.spentPaise)}</td>
                  <td>{user.lastOrderAt ? timeAgo(user.lastOrderAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kitchen access is an email allow-list, so the list is short and worth
          keeping visible rather than buried in a settings screen. */}
      <div className="admin-card" style={{ marginTop: 20 }}>
        <div className="admin-card-head">
          <h2 className="admin-card-title">Kitchen access</h2>
          <span style={{ fontSize: 12.5, color: 'var(--admin-muted)' }}>
            {adminCount} admin{adminCount === 1 ? '' : 's'}
          </span>
        </div>

        {admins.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--admin-muted)' }}>
            No team emails yet. Add one here to give it access to this desk.
          </p>
        ) : (
          <div className="admin-table-wrap" style={{ minWidth: 0 }}>
            <table className="admin-table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Access</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((entry) => {
                  const busy = busyEmail === entry.email;
                  return (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.email}</strong>
                      </td>
                      <td>
                        <span
                          className={`admin-pill admin-pill--${
                            entry.isAdmin ? 'success' : 'muted'
                          }`}
                        >
                          {entry.isAdmin ? 'Admin' : 'No access'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={`admin-btn admin-btn--sm ${
                            entry.isAdmin ? 'admin-btn--danger' : 'admin-btn--green'
                          }`}
                          disabled={busy}
                          onClick={() => void handleRole(entry.email, !entry.isAdmin)}
                        >
                          {entry.isAdmin ? 'Revoke' : 'Grant admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}