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
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState<number>(15 * 60);

  const load = useCallback(async () => {
    const activeToken = token || findTracking(orderId)?.token;
    if (!activeToken) {
      setLoading(false);
      setError('Private tracking link required to view this order.');
      return;
    }
    try {
      const response = await api.get<{ order: TrackOrder }>(
        `/api/orders/${orderId}?token=${encodeURIComponent(activeToken)}`
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

  // Payment timer countdown: runs unconditionally above early returns
  useEffect(() => {
    if (!order || order.status !== 'payment_verification_pending') return;
    const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
    setRemainingSecs(Math.max(0, 15 * 60 - elapsed));

    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
      setRemainingSecs(Math.max(0, 15 * 60 - currentElapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

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
  const qrSrc = '/assets/images/pm_zaika_phonepe_qr.png';
  const mins = Math.floor(remainingSecs / 60);
  const secs = remainingSecs % 60;
  const timerDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isExpired = remainingSecs === 0;

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(order.upi.vpa);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2200);
    }
  };

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
          {/* Urgent Payment & Verification Warning Banner */}
          <div className="track-payment-warning-banner" style={{ borderLeft: isExpired ? '4px solid #DC2626' : '4px solid #F59E0B' }}>
            <div className="warning-banner-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span>⏱️ 15-Minute Payment Window</span>
              <span style={{
                background: isExpired ? '#FEE2E2' : '#FEF3C7',
                color: isExpired ? '#DC2626' : '#B45309',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 700,
                border: isExpired ? '1px solid #FCA5A5' : '1px solid #FCD34D'
              }}>
                {isExpired ? '⚠️ Time Expired' : `⏳ ${timerDisplay} remaining`}
              </span>
            </div>
            <p className="warning-banner-text" style={{ marginTop: '6px' }}>
              {isExpired
                ? 'Your 15-minute payment window has expired. If you have already transferred the money, please click the WhatsApp button below immediately so our kitchen can verify it.'
                : 'Please complete your UPI transfer and share your payment screenshot on WhatsApp within 15 minutes. Food preparation begins only after our kitchen staff verifies your payment.'}
            </p>
          </div>

          <h2 className="track-panel-title">Scan &amp; Pay {rupees(order.totals.grandTotalPaise)}</h2>

          {/* UPI ID with quick copy button */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.04)',
            padding: '6px 14px',
            borderRadius: '8px',
            margin: '6px auto 14px',
            fontSize: '13px'
          }}>
            <span>UPI ID: <strong>{order.upi.vpa}</strong></span>
            <button
              type="button"
              onClick={handleCopyUpi}
              style={{
                background: copiedUpi ? '#10B981' : '#F59E0B',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copiedUpi ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt={`Official PhonePe UPI QR for order ${order.orderId}`} className="track-qr" />
          </div>
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

          {/* Critical Mandatory Step Warning */}
          <div style={{
            background: '#EFF6FF',
            border: '1.5px solid #3B82F6',
            borderRadius: '10px',
            padding: '12px 14px',
            margin: '16px 0 14px',
            textAlign: 'left',
            fontSize: '12.5px',
            color: '#1E40AF',
            lineHeight: 1.5
          }}>
            <strong>📸 Step 2 (Mandatory):</strong> After completing your UPI transfer, take a screenshot of the successful transaction and send it on WhatsApp so kitchen staff can confirm and start cooking immediately:
          </div>

          <button type="button" className="track-wa" onClick={sendProof} style={{ width: '100%', maxWidth: '380px', margin: '0 auto', display: 'block' }}>
            Share payment proof on WhatsApp →
          </button>

          {/* Fraud Security Notice */}
          <p style={{ marginTop: '14px', fontSize: '11.5px', color: '#6B7280', textAlign: 'center' }}>
            🔒 <em>Security Notice: Verify payee is <strong>PM Zaika</strong> (<code>pmzaika@ybl</code>). Our staff will never ask for your UPI PIN or OTP.</em>
          </p>
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