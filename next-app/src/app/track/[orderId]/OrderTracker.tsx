'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { api, ApiError, findTracking } from '@/lib/client/api';
import { toWhatsappNumber } from '@/lib/notifications/whatsapp';

interface TrackItem {
  title: string;
  qty: number;
  lineTotalPaise: number;
}

interface TrackOrder {
  orderId: string;
  status: string;
  statusMeta: { label: string; description: string; tone: string; step: number };
  paymentStatus: string;
  transactionReference: string | null;
  customerMarkedPaid: boolean;
  orderType: 'delivery' | 'dinein';
  customerPhone: string;
  customerName: string;
  items: TrackItem[];
  totals: {
    subtotalPaise: number;
    deliveryChargePaise: number;
    taxPaise: number;
    discountPaise: number;
    grandTotalPaise: number;
  };
  upi: { vpa: string; payeeName: string; amountPaise: number };
  upiAppLinks?: Array<{ label: string; href: string }>;
  createdAt: string;
}

const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

/** Live order status + UPI payment QR. Polls until the order reaches a terminal state. */
export default function OrderTracker({
  orderId,
  initialToken,
}: {
  orderId: string;
  initialToken?: string;
}) {
  // The token is issued once at checkout. Fall back to this browser's stored
// history so a page reload still works. The first render always shows the
// loading state, so reading storage during initialisation cannot cause a
// hydration mismatch.
  const [token] = useState(() => initialToken || findTracking(orderId)?.token || '');
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get<{ order: TrackOrder }>(
        `/api/orders/${orderId}?token=${encodeURIComponent(token)}`
      );
      setOrder(response.order);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not load this order right now.'
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    // `load` only calls setState after the fetch resolves, so this is an async
    // subscription rather than a synchronous render-time update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Poll while the order is still moving, pausing when the tab is hidden.
  useEffect(() => {
    if (!order || ['delivered', 'served', 'cancelled'].includes(order.status)) return;

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void load();
    }, 30000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void load();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [order, load]);

  if (loading) {
    return <p className="track-state">Loading your order…</p>;
  }

  if (error || !order) {
    return (
      <div className="track-state">
        <p>{error ?? 'Order not found.'}</p>
        <p className="track-hint">
          This page needs the private link we sent you on WhatsApp. Please open that
          link again, or call the restaurant with your order number.
        </p>
        <Link href="/cart" className="track-link">
          Back to cart
        </Link>
      </div>
    );
  }

  const awaitingPayment = order.status === 'payment_verification_pending';
  const qrSrc = `/api/orders/${order.orderId}/qr?token=${encodeURIComponent(token)}`;

  const sendProof = async () => {
    const message = [
      `💳 *PAYMENT PROOF - ${order.orderId}*`,
      `Total: ${rupees(order.totals.grandTotalPaise)}`,
      `UPI VPA: ${order.upi.vpa}`,
      '📎 Please find my payment screenshot attached.',
    ].join('\n');

    // Send screenshot directly to the restaurant's WhatsApp desk (917488260572)
    window.open(
      `https://wa.me/917488260572?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <div className="track-wrap">
      <header className="track-head">
        <p className="track-eyebrow">ORDER RECEIVED</p>
        <h1 className="track-title">{order.orderId}</h1>
        <p className="track-status" data-tone={order.statusMeta.tone}>
          {order.statusMeta.label}
        </p>
        <p className="track-hint">{order.statusMeta.description}</p>
      </header>

      {awaitingPayment && (
        <section className="track-panel track-panel--pay">
          <h2 className="track-panel-title">Scan &amp; Pay ₹{order.upi.amountPaise / 100}</h2>
          <p className="track-hint">
            Pay to <strong>{order.upi.vpa}</strong> using any UPI app or scan the QR below.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt={`UPI QR for order ${order.orderId}`} className="track-qr" />
          <div className="track-amount">{rupees(order.totals.grandTotalPaise)}</div>

          {order.upiAppLinks && order.upiAppLinks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', margin: '14px 0' }}>
              {order.upiAppLinks.map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  className="admin-btn admin-btn--sm"
                  style={{ textDecoration: 'none', fontSize: '13px', padding: '6px 12px' }}
                >
                  Pay via {app.label}
                </a>
              ))}
            </div>
          )}

          <p className="track-hint" style={{ marginTop: '12px' }}>
            After paying, share your payment screenshot on WhatsApp so our kitchen can verify and prepare your food:
          </p>
          <button type="button" className="track-wa" onClick={sendProof}>
            Share payment proof on WhatsApp →
          </button>
        </section>
      )}

      <section className="track-panel">
        <h2 className="track-panel-title">Order Items</h2>
        <ul className="track-items">
          {order.items.map((item, index) => (
            <li key={`${item.title}-${index}`} className="track-item">
              <span className="track-item-name">
                {item.title} <span className="track-item-qty">× {item.qty}</span>
              </span>
              <span className="track-item-price">{rupees(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>

        <div className="track-total-row">
          <span>Subtotal</span>
          <span>{rupees(order.totals.subtotalPaise)}</span>
        </div>
        {order.totals.discountPaise > 0 && (
          <div className="track-total-row">
            <span>Discount</span>
            <span>− {rupees(order.totals.discountPaise)}</span>
          </div>
        )}
        {order.totals.deliveryChargePaise > 0 && (
          <div className="track-total-row">
            <span>Delivery</span>
            <span>{rupees(order.totals.deliveryChargePaise)}</span>
          </div>
        )}
        {order.totals.taxPaise > 0 && (
          <div className="track-total-row">
            <span>GST</span>
            <span>{rupees(order.totals.taxPaise)}</span>
          </div>
        )}
        <div className="track-total-row track-total-row--grand">
          <span>Total</span>
          <span>{rupees(order.totals.grandTotalPaise)}</span>
        </div>
      </section>

      <p className="track-hint">
        Placed {new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </p>
    </div>
  );
}