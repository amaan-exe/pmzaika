'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { fetchOrders, orderWhatsappLinks, updateOrderStatus } from '@/lib/client/adminApi';
import type { AdminOrder, OrderStatus, StatusAction } from '@/lib/admin/types';
import {
  Alert,
  EmptyState,
  Loading,
  PageHeader,
  PaymentPill,
  rupees,
  StatusPill,
  timeAgo,
} from '@/components/admin/ui';
import { useAsyncData, usePolling } from '@/components/admin/useAsyncData';
import { useNewOrderAlert } from '@/components/admin/useNewOrderAlert';
import IncomingOrderAlert from '@/components/admin/IncomingOrderAlert';
import NotificationSettingsModal from '@/components/admin/NotificationSettingsModal';

type Tab = 'open' | 'awaiting' | 'all' | 'archive';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'open', label: 'Live orders' },
  { id: 'awaiting', label: 'Awaiting payment' },
  { id: 'all', label: 'Everything' },
  { id: 'archive', label: 'Archive' },
];

const REFRESH_MS = 8_000;

/** Kitchen priority: payment decisions first, then cooking, then done. */
const PRIORITY: Record<string, number> = {
  payment_verification_pending: 0,
  preparing: 1,
  confirmed: 2,
  ready: 3,
  out_for_delivery: 4,
  delivered: 5,
  served: 5,
  cancelled: 6,
};

function OrderCard({
  order,
  busy,
  highlighted,
  onAction,
  onNotify,
}: {
  order: AdminOrder;
  busy: boolean;
  highlighted?: boolean;
  onAction: (action: StatusAction) => void;
  onNotify: (order: AdminOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Orders awaiting a payment decision are the ones that need attention first.
  const urgent = order.status === 'payment_verification_pending';

  return (
    <article
      id={`order-${order.orderId}`}
      className={`order-card${urgent ? ' order-card--urgent' : ''}${
        highlighted ? ' order-card--highlighted' : ''
      }`}
    >
      <div className="order-card-head">
        <div>
          <div className="order-card-id">{order.orderId}</div>
          <div className="order-card-time">
            {timeAgo(order.createdAt)} ·{' '}
            {order.orderType === 'delivery' ? '🛵 Delivery' : '🍽️ Dine-in'}
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div>
        <div className="order-card-customer">
          {order.customerName} ·{' '}
          <a href={`tel:${order.customerPhone}`} style={{ color: 'var(--admin-amber)' }}>
            {order.customerPhone}
          </a>
        </div>
        <div className="order-card-meta">
          {order.orderType === 'delivery'
            ? order.deliveryAddress || 'No address given'
            : order.seatingNote || 'No seating preference'}
        </div>
      </div>

      {/* Payment proof the customer submitted */}
      {(order.transactionReference || order.customerMarkedPaid) && (
        <div className="order-proof">
          <span>
            {order.transactionReference ? (
              <>
                UTR <code>{order.transactionReference}</code>
              </>
            ) : (
              'Customer marked as paid'
            )}
          </span>
          <PaymentPill status={order.paymentStatus} />
        </div>
      )}

      {order.notes && (
        <div className="order-card-meta">
          <strong style={{ color: 'var(--admin-text)' }}>Chef note:</strong> {order.notes}
        </div>
      )}

      <ul className="order-items">
        {order.items.map((item, index) => (
          <li key={`${item.title}-${index}`}>
            <span>
              <strong>
                {item.qty} × {item.title}
              </strong>
            </span>
            <span>{rupees(item.lineTotalPaise)}</span>
          </li>
        ))}
      </ul>

      <div className="order-card-foot">
        <div>
          <span className="order-total">{rupees(order.totals.grandTotalPaise)}</span>
          <div style={{ fontSize: '11px', color: 'var(--admin-muted)', marginTop: '2px' }}>
            Items: {rupees(order.totals.subtotalPaise)}
            {order.totals.deliveryChargePaise > 0 ? ` · Delivery: ${rupees(order.totals.deliveryChargePaise)}` : ' · Free delivery'}
            {order.totals.discountPaise > 0 ? ` · Discount: -${rupees(order.totals.discountPaise)}` : ''}
          </div>
        </div>

        <div className="order-actions">
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            onClick={() => onNotify(order)}
            title="Send a WhatsApp update to the customer"
          >
            Notify
          </button>
          {order.actions.map((action) => {
            const isPrimary = action.status === 'confirmed';
            const isDanger = action.status === 'cancelled';
            return (
              <button
                key={action.status}
                type="button"
                disabled={busy}
                onClick={() => onAction(action)}
                className={`admin-btn admin-btn--sm${
                  isPrimary ? ' admin-btn--primary' : isDanger ? ' admin-btn--danger' : ' admin-btn--green'
                }`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {order.refund.status !== 'NONE' && (
        <div className="order-card-meta">
          Refund: <strong>{order.refund.status}</strong>
          {order.refund.amountPaise > 0 && <> · {rupees(order.refund.amountPaise)}</>}
        </div>
      )}

      <button
        type="button"
        className="admin-btn admin-btn--sm"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? 'Hide history' : `History (${order.timeline.length})`}
      </button>

      {expanded && (
        <ol
          style={{
            margin: 0,
            paddingLeft: '18px',
            fontSize: '12.5px',
            color: 'var(--admin-muted)',
            lineHeight: 1.7,
          }}
        >
          {order.timeline.map((event, index) => (
            <li key={`${event.at}-${index}`}>
              <strong style={{ color: 'var(--admin-text)' }}>{event.status}</strong> ·{' '}
              {new Date(event.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} ·{' '}
              {event.actor}
              {event.note ? ` — ${event.note}` : ''}
            </li>
          ))}
          {order.trackingToken && (
            <li>
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    `${window.location.origin}/track/${order.orderId}?token=${order.trackingToken}`
                  )
                }
              >
                Copy customer tracking link
              </button>
            </li>
          )}
        </ol>
      )}
    </article>
  );
}

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<Tab>('open');
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, error, loading, reload } = useAsyncData(
    () =>
      fetchOrders({
        search: search.trim() || undefined,
        orderType: (orderType || undefined) as 'delivery' | 'dinein' | undefined,
        scope: tab === 'archive' ? 'archive' : 'active',
        limit: 100,
        ...(tab === 'awaiting' ? { paymentStatus: 'awaiting,verification_pending' } : {}),
        ...(tab === 'open' ? { status: 'open' as const } : {}),
      }),
    [tab, search, orderType],
  );

  // Keep the queue live without hammering the API; openly polls even when tab is in another panel.
  usePolling(reload, REFRESH_MS, { pollInBackground: true });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const orders = useMemo(() => {
    if (!data) return [];
    return [...data.orders].sort(
      (a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9),
    );
  }, [data]);

  const {
    config: soundConfig,
    updateConfig: updateSoundConfig,
    soundEnabled,
    toggleSound,
    activeAlertOrder,
    unacknowledgedCount,
    isRinging,
    acknowledgeOrder,
    acknowledgeAllOrders,
    testSound,
  } = useNewOrderAlert(orders);

  // Chime when a new order lands — kitchens are loud and staff are not always
  // looking at the screen. Browsers require a user gesture before audio plays.
  const handleAction = useCallback(
    async (order: AdminOrder, action: StatusAction) => {
      setBusyId(order.orderId);
      setNotice(null);
      acknowledgeOrder(order.orderId);

      try {
        await updateOrderStatus(order.orderId, {
          status: action.status as OrderStatus,
          note: `${action.label} from the kitchen desk`,
        });
        setNotice(`${order.orderId} → ${action.status.replace(/_/g, ' ')}`);
        reload();
      } catch (caught) {
        // Surface the server's reason — usually an illegal transition.
        setNotice(null);
        throw caught;
      } finally {
        setBusyId(null);
      }
    },
    [reload, acknowledgeOrder],
  );

  const handleNotify = useCallback(async (order: AdminOrder) => {
    try {
      const links = await orderWhatsappLinks(order.orderId);
      window.open(links.statusUpdate.url, '_blank', 'noopener');
    } catch {
      // The order card already shows the phone; a failed deep link is not fatal.
    }
  }, []);

  const handleViewOrder = useCallback((orderId: string) => {
    acknowledgeOrder(orderId);
    setHighlightedId(orderId);
    setTab('all');

    setTimeout(() => {
      const el = document.getElementById(`order-${orderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedId((curr) => (curr === orderId ? null : curr));
    }, 6000);
  }, [acknowledgeOrder]);

  const counts = useMemo(() => {
    const awaiting = orders.filter(
      (order) => order.paymentStatus === 'awaiting' || order.paymentStatus === 'verification_pending',
    ).length;
    return { total: orders.length, awaiting };
  }, [orders]);

  return (
    <>
      <IncomingOrderAlert
        order={activeAlertOrder}
        unacknowledgedCount={unacknowledgedCount}
        isRinging={isRinging}
        onViewOrder={handleViewOrder}
        onAcknowledge={acknowledgeOrder}
        onAcknowledgeAll={acknowledgeAllOrders}
      />

      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={soundConfig}
        onUpdateConfig={updateSoundConfig}
        onTestSound={testSound}
      />

      <PageHeader
        title="Orders desk"
        subtitle={
          loading
            ? 'Loading…'
            : `${counts.total} order${counts.total === 1 ? '' : 's'}${
                counts.awaiting > 0 ? ` · ${counts.awaiting} awaiting payment` : ''
              }`
        }
        actions={
          <>
            <button
              type="button"
              className={`admin-btn admin-btn--sm ${
                soundEnabled
                  ? isRinging
                    ? 'admin-btn--urgent-pulse'
                    : 'admin-btn--green'
                  : ''
              }`}
              onClick={toggleSound}
              title={soundEnabled ? 'Order sound alarm is on' : 'Get an audio alert when a new order arrives'}
            >
              {soundEnabled ? (isRinging ? '🚨 Alarm Ringing' : '🔔 Chime on') : '🔕 Chime off'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--sm"
              onClick={() => setIsSettingsOpen(true)}
              title="Configure alert tones, repeating alarm, and Web Push notifications"
            >
              ⚙️ Alert Settings
            </button>
            <button type="button" className="admin-btn admin-btn--sm" onClick={reload}>
              Refresh
            </button>
          </>
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

        <select
          className="admin-select"
          style={{ width: 'auto' }}
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          aria-label="Filter by order type"
        >
          <option value="">All types</option>
          <option value="delivery">Delivery</option>
          <option value="dinein">Dine-in</option>
        </select>

        <input
          className="admin-input admin-search"
          type="search"
          placeholder="Search order id, name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      {loading ? (
        <Loading label="Loading orders…" />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Nothing here right now"
          hint={
            tab === 'awaiting'
              ? 'No orders are waiting on a payment decision.'
              : tab === 'archive'
                ? 'Completed and cancelled orders will be filed here.'
                : 'New orders will appear the moment a customer checks out.'
          }
        />
      ) : (
        <div className="admin-orders-grid">
          {orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              busy={busyId === order.orderId}
              highlighted={highlightedId === order.orderId}
              onAction={(action) => void handleAction(order, action)}
              onNotify={(target) => void handleNotify(target)}
            />
          ))}
        </div>
      )}
    </>
  );
}