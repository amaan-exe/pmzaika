'use client';

import React, { useMemo } from 'react';

import { fetchPayments } from '@/lib/client/adminApi';
import type { AdminPayment } from '@/lib/admin/types';
import {
  Alert,
  EmptyState,
  Loading,
  PageHeader,
  PaymentPill,
  rupees,
  StatCard,
  StatGrid,
  dateTime,
} from '@/components/admin/ui';
import { useAsyncData } from '@/components/admin/useAsyncData';

export default function AdminPaymentsPage() {
  const { data, error, loading, reload } = useAsyncData(() => fetchPayments(), []);

  const entries = data?.entries ?? [];

  // Money arrives in paise and is only ever rendered through `rupees`.
  const totals = useMemo(() => {
    let verifiedPaise = 0;
    let pending = 0;
    let refundedPaise = 0;
    let refundedCount = 0;

    for (const entry of entries) {
      if (entry.paymentStatus === 'verified') verifiedPaise += entry.amountPaise;
      if (entry.paymentStatus === 'verification_pending' || entry.paymentStatus === 'awaiting') {
        pending += 1;
      }
      if (entry.paymentStatus === 'refunded') {
        refundedPaise += entry.amountPaise;
        refundedCount += 1;
      }
    }

    return { verifiedPaise, pending, refundedPaise, refundedCount };
  }, [entries]);

  return (
    <>
      <PageHeader
        title="Payment ledger"
        subtitle="Every UPI payment the store has been told about, newest first."
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

      <StatGrid>
        <StatCard
          label="Payment entries"
          value={entries.length}
          hint="One row per order that reached checkout"
        />
        <StatCard
          label="Verified amount"
          value={rupees(totals.verifiedPaise)}
          hint="UPI references an admin has confirmed"
          tone="green"
        />
        <StatCard
          label="Awaiting verification"
          value={totals.pending}
          hint="Chase these on the orders desk"
          tone={totals.pending > 0 ? 'amber' : 'plain'}
        />
        <StatCard
          label="Refunded"
          value={rupees(totals.refundedPaise)}
          hint={
            totals.refundedCount > 0
              ? `${totals.refundedCount} refund${totals.refundedCount === 1 ? '' : 's'} processed`
              : 'No refunds issued'
          }
          tone="red"
        />
      </StatGrid>

      {/* There is no gateway here, so this ledger is a record of a human
          decision made on the orders desk — not a live reconciliation feed. */}
      <Alert kind="info">
        Payments are collected by UPI and verified by hand — there is no payment gateway
        behind this store. Verify the UTR against your UPI app on the{' '}
        <strong>orders desk</strong>, and this ledger records the outcome.
      </Alert>

      {loading ? (
        <Loading label="Loading payments…" />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          hint="Entries appear as soon as customers submit their UPI reference at checkout."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>UTR</th>
                <th>Verified by</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: AdminPayment) => (
                <tr key={`${entry.orderId}-${entry.createdAt}`}>
                  <td>
                    <strong>{entry.orderId}</strong>
                    <div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>
                      {entry.method}
                    </div>
                  </td>
                  <td>
                    {entry.customerName}
                    <div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>
                      {entry.customerPhone}
                    </div>
                  </td>
                  <td className="num">{rupees(entry.amountPaise)}</td>
                  <td>
                    <PaymentPill status={entry.paymentStatus} />
                    <div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>
                      {entry.paymentLabel}
                    </div>
                  </td>
                  <td>
                    {entry.transactionReference ? (
                      <code style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                        {entry.transactionReference}
                      </code>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{entry.verifiedBy ?? '—'}</td>
                  <td>{dateTime(entry.verifiedAt ?? entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}