/** Small presentational building blocks shared by every admin desk. */

'use client';

import React from 'react';

import type { AdminStats, OrderStatus, PaymentStatus } from '@/lib/admin/types';

export const rupees = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export const dateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

// ---------------------------------------------------------------------------

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'plain' | 'amber' | 'green' | 'red' | 'blue';
}

export function StatCard({ label, value, hint, tone = 'plain' }: StatCardProps) {
  return (
    <div className={`stat-card${tone === 'plain' ? '' : ` stat-card--${tone}`}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="stat-grid">{children}</div>;
}

// ---------------------------------------------------------------------------

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  awaiting: 'muted',
  verification_pending: 'pending',
  verified: 'success',
  rejected: 'danger',
  refunded: 'active',
};

const PAYMENT_TEXT: Record<PaymentStatus, string> = {
  awaiting: 'Not paid',
  verification_pending: 'Proof sent',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded',
};

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={`admin-pill admin-pill--${PAYMENT_TONE[status]}`}>
      {PAYMENT_TEXT[status]}
    </span>
  );
}

const STATUS_TONE: Record<OrderStatus, string> = {
  payment_verification_pending: 'pending',
  confirmed: 'active',
  preparing: 'active',
  ready: 'active',
  out_for_delivery: 'active',
  delivered: 'success',
  served: 'success',
  cancelled: 'danger',
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  payment_verification_pending: 'Payment awaiting',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  served: 'Served',
  cancelled: 'Cancelled',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`admin-pill admin-pill--${STATUS_TONE[status]}`}>
      {STATUS_TEXT[status]}
    </span>
  );
}

export { PAYMENT_TONE, PAYMENT_TEXT, STATUS_TONE, STATUS_TEXT };

// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="admin-header">
      <div>
        <h1 className="admin-title">{title}</h1>
        {subtitle && <p className="admin-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="admin-toolbar">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-title">{title}</div>
      {hint && <p style={{ margin: 0, fontSize: 13.5 }}>{hint}</p>}
    </div>
  );
}

export function Alert({
  kind = 'info',
  children,
}: {
  kind?: 'info' | 'error' | 'success';
  children: React.ReactNode;
}) {
  return (
    <div className={`admin-alert admin-alert--${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      {children}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="admin-loading">{label}</div>;
}

// ---------------------------------------------------------------------------

export function OverviewStats({ stats }: { stats: AdminStats }) {
  return (
    <StatGrid>
      <StatCard
        label="Orders today"
        value={stats.totalOrders}
        hint={`${stats.openOrders} still open`}
        tone="blue"
      />
      <StatCard
        label="Awaiting payment"
        value={stats.awaitingPayment}
        hint="Proof submitted, not verified"
        tone="amber"
      />
      <StatCard
        label="Completed revenue"
        value={rupees(stats.revenuePaise)}
        hint="Delivered and served orders"
        tone="green"
      />
      <StatCard
        label="Verified payments"
        value={rupees(stats.paidRevenuePaise)}
        hint="UPI collected and confirmed"
        tone="green"
      />
      <StatCard
        label="Average order"
        value={rupees(stats.averageOrderValuePaise)}
        hint="Across every order on record"
      />
      <StatCard
        label="Menu availability"
        value={`${stats.availableDishes}/${stats.totalDishes}`}
        hint={`${stats.lowStockCount} marked unavailable`}
        tone={stats.lowStockCount > 0 ? 'red' : 'plain'}
      />
    </StatGrid>
  );
}