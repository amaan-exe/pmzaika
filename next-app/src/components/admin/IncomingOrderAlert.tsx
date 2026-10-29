'use client';

import React, { useEffect } from 'react';
import type { AdminOrder } from '@/lib/admin/types';
import { rupees } from '@/components/admin/ui';

interface IncomingOrderAlertProps {
  order: AdminOrder | null;
  unacknowledgedCount?: number;
  isRinging: boolean;
  onViewOrder: (orderId: string) => void;
  onAcknowledge: (orderId?: string) => void;
  onAcknowledgeAll?: () => void;
}

export default function IncomingOrderAlert({
  order,
  unacknowledgedCount = 1,
  isRinging,
  onViewOrder,
  onAcknowledge,
  onAcknowledgeAll,
}: IncomingOrderAlertProps) {
  // Listen for service worker notification click acknowledgments
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ORDER_ALERT_ACKNOWLEDGED') {
        const id = event.data.orderId;
        onAcknowledge(id);
        if (event.data.action === 'view_order' && id) {
          onViewOrder(id);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [onAcknowledge, onViewOrder]);

  if (!order) return null;

  const itemsSummary = order.items && order.items.length
    ? order.items.map((i) => `${i.title} × ${i.qty}`).join(', ')
    : 'New items to prepare';

  return (
    <aside
      className="admin-incoming-alert-overlay"
      role="alert"
      aria-live="assertive"
    >
      <div className="admin-incoming-alert-card">
        {/* Animated radar rings and beacon */}
        <div className="admin-incoming-alert-glow" aria-hidden="true" />

        <div className="admin-incoming-alert-header">
          <div className="admin-incoming-alert-badge-row">
            <span className="admin-incoming-pulse-dot" />
            <span className="admin-incoming-alert-tag">
              {isRinging ? '🚨 ALARM ACTIVE — RINGS UNTIL ACKNOWLEDGED' : '🔔 ORDER RECEIVED'}
            </span>
            <span className="admin-incoming-order-id">#{order.orderId}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unacknowledgedCount > 1 && (
              <span className="admin-incoming-count-badge">
                {unacknowledgedCount} Orders Ringing
              </span>
            )}

            {isRinging && (
              <div className="admin-sound-wave-bars" title="Alarm is ringing continuously">
                <span className="admin-sound-bar" />
                <span className="admin-sound-bar" />
                <span className="admin-sound-bar" />
                <span className="admin-sound-bar" />
              </div>
            )}
          </div>
        </div>

        <div className="admin-incoming-alert-body">
          <div className="admin-incoming-alert-main">
            <div className="admin-incoming-customer-info">
              <h3 className="admin-incoming-customer-name">
                {order.customerName || 'Customer'}
                <span className="admin-incoming-order-type">
                  {order.orderType === 'delivery' ? '🛵 Doorstep Delivery' : '🍽️ Dine-in / Takeaway'}
                </span>
              </h3>
              {order.customerPhone && (
                <p className="admin-incoming-phone">📞 {order.customerPhone}</p>
              )}
            </div>

            <div className="admin-incoming-price-box">
              <span className="admin-incoming-price-label">Collect / Total</span>
              <span className="admin-incoming-price-value">
                {rupees(order.totals.grandTotalPaise)}
              </span>
            </div>
          </div>

          <div className="admin-incoming-items-preview">
            <span className="admin-incoming-items-icon">📋</span>
            <span className="admin-incoming-items-text">{itemsSummary}</span>
          </div>
        </div>

        <div className="admin-incoming-alert-actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary admin-btn-action-primary"
            onClick={() => {
              onAcknowledge(order.orderId);
              onViewOrder(order.orderId);
            }}
          >
            <span>✅ Acknowledge & Open Order</span>
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--warning"
            onClick={() => onAcknowledge(order.orderId)}
            title="Stop the continuous alarm for this order"
          >
            <span>🔕 Acknowledge & Silence</span>
          </button>

          {unacknowledgedCount > 1 && onAcknowledgeAll && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={onAcknowledgeAll}
              title="Acknowledge all pending orders at once"
            >
              <span>Acknowledge All</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
