'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { fetchOrders, fetchStats } from '@/lib/client/adminApi';
import type { AdminOrder } from '@/lib/admin/types';
import {
  Alert,
  Loading,
  OverviewStats,
  PageHeader,
  rupees,
  StatusPill,
  timeAgo,
} from '@/components/admin/ui';
import { useAsyncData } from '@/components/admin/useAsyncData';

export default function AdminOverviewPage() {
  const stats = useAsyncData(() => fetchStats(), []);
  const recent = useAsyncData(() => fetchOrders({ limit: 8, scope: 'all' }), []);

  const categories = useMemo(() => stats.data?.categories ?? [], [stats.data]);
  const orders = useMemo(() => recent.data?.orders ?? [], [recent.data]);

  const loading = stats.loading || recent.loading;
  const error = stats.error ?? recent.error;

  if (loading) return <Loading label="Loading the kitchen desk…" />;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Today at a glance — payments to chase, dishes to switch off, money collected."
      />

      {error && <Alert kind="error">{error}</Alert>}
      {stats.data && <OverviewStats stats={stats.data.stats} />}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Recent orders */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Latest orders</h2>
            <Link href="/admin/orders" className="admin-btn admin-btn--sm">
              Open orders desk
            </Link>
          </div>

          {orders.length === 0 ? (
            <p style={{ color: 'var(--admin-muted)', fontSize: 13.5, margin: 0 }}>
              No orders yet. They will appear here the moment a customer checks out.
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: AdminOrder) => (
                    <tr key={order.orderId}>
                      <td>
                        <strong>{order.orderId}</strong>
                        <div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>
                          {timeAgo(order.createdAt)}
                        </div>
                      </td>
                      <td>{order.customerName}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td className="num">{rupees(order.totals.grandTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category health */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Menu availability</h2>
            <Link href="/admin/menu" className="admin-btn admin-btn--sm">
              Manage menu
            </Link>
          </div>

          {categories.length === 0 ? (
            <p style={{ color: 'var(--admin-muted)', fontSize: 13.5, margin: 0 }}>
              The menu is empty.
            </p>
          ) : (
            <div className="admin-table-wrap" style={{ maxHeight: 340, overflowY: 'auto' }}>
              <table className="admin-table" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num">Dishes</th>
                    <th className="num">Live</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td className="num">{category.count}</td>
                      <td className="num">
                        <span
                          className={`admin-pill admin-pill--${
                            category.available === category.count ? 'success' : 'pending'
                          }`}
                        >
                          {category.available}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment queue — the single most important number in a UPI workflow */}
      {stats.data && stats.data.stats.awaitingPayment > 0 && (
        <div style={{ marginTop: '18px' }}>
          <div className="admin-card" style={{ borderColor: 'rgba(245,166,35,0.4)' }}>
            <div className="admin-card-head">
              <h2 className="admin-card-title">
                Waiting on you · {stats.data.stats.awaitingPayment} payment
                {stats.data.stats.awaitingPayment === 1 ? '' : 's'}
              </h2>
              <Link
                href="/admin/orders?filter=awaiting"
                className="admin-btn admin-btn--sm admin-btn--primary"
              >
                Verify now
              </Link>
            </div>
            <p style={{ color: 'var(--admin-muted)', fontSize: 13.5, margin: 0 }}>
              Customers paid by UPI and shared proof on WhatsApp. Open the orders desk and
              press <strong>Verify Payment</strong> once the amount matches.
            </p>
          </div>
        </div>
      )}
    </>
  );
}