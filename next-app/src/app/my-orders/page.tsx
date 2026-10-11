'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { readTrackingHistory, rememberTracking } from '@/lib/client/api';
import type { PublicOrder } from '@/lib/orders/service';

export default function MyOrdersPage() {
  const { user, loading: authLoading, openAuth, getIdToken } = useAuth();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken();
        const res = await fetch('/api/my/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load your orders.');
        }

        const data = await res.json();
        if (!cancelled && data.ok) {
          const loadedOrders = data.orders || [];
          setOrders(loadedOrders);
          loadedOrders.forEach((ord: any) => {
            if (ord.orderId && ord.trackingToken) {
              rememberTracking({ orderId: ord.orderId, token: ord.trackingToken });
            }
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load your orders.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      loadOrders();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, getIdToken]);

  // Read local session tracking history in case user just placed an order
  const storedTracking = typeof window !== 'undefined' ? readTrackingHistory() : [];

  const formatPrice = (paise: number) => `₹${Math.round(paise / 100)}`;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="cart-page-wrapper" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
      {/* Hero Banner */}
      <section className="cart-luxury-banner">
        <div className="container">
          <div className="cart-banner-badge">
            <span className="badge-pulse-dot"></span>
            <span>Live Order Status • Kitchen Updates</span>
          </div>
          <h1 className="cart-banner-heading">Your Orders</h1>
          <nav className="cart-breadcrumb-trail" aria-label="Breadcrumb">
            <Link href="/" className="crumb-link">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">My Orders</span>
          </nav>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '900px', marginTop: '36px' }}>
        {authLoading || loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6f655b' }}>
            <div className="admin-spinner" style={{ margin: '0 auto 16px', width: '28px', height: '28px', borderWidth: '3px' }}></div>
            <p style={{ fontWeight: 600 }}>Loading your culinary orders…</p>
          </div>
        ) : !user ? (
          <div className="empty-cart-experience">
            <div className="empty-cart-luxury-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
              <div className="empty-cloche-frame">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="empty-card-heading">Sign In to View Orders</h2>
              <p className="empty-card-subtitle">
                Please sign in with your PM Zaika account to view your past orders, invoice details, and live kitchen tracking.
              </p>
              <div className="empty-card-actions">
                <button
                  type="button"
                  className="btn-explore-menu"
                  onClick={openAuth}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  <span>Sign In Now</span>
                  <span className="btn-arrow-circle">→</span>
                </button>
              </div>

              {storedTracking.length > 0 && (
                <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #ede4d8', textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: '10px' }}>
                    Recent Order Placed on This Browser:
                  </p>
                  {storedTracking.map((item) => (
                    <Link
                      key={item.orderId}
                      href={`/track/${item.orderId}?token=${item.token}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#fff',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        marginBottom: '8px',
                        textDecoration: 'none',
                        color: '#1F2937',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      <span>Order #{item.orderId}</span>
                      <span style={{ color: '#F05D23' }}>Track Live →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', background: '#fff0ed', color: '#c0392b', borderRadius: '14px', textAlign: 'center' }}>
            <p style={{ fontWeight: 700 }}>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ marginTop: '12px', padding: '8px 18px', borderRadius: '8px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-cart-experience">
            <div className="empty-cart-luxury-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
              <div className="empty-cloche-frame">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h2 className="empty-card-heading">No Orders Yet</h2>
              <p className="empty-card-subtitle">
                You haven&apos;t placed any orders with this account yet. Treat yourself to our signature Biryanis, Tandoori kebabs, or curries today!
              </p>
              <div className="empty-card-actions">
                <Link href="/#menu-showcase" className="btn-explore-menu">
                  <span>Explore Menu Showcase</span>
                  <span className="btn-arrow-circle">→</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order: any) => {
              // Lookup token if missing on order object
              const token =
                (order as { trackingToken?: string }).trackingToken ||
                storedTracking.find((t) => t.orderId === order.orderId)?.token ||
                '';

              const trackHref = token
                ? `/track/${order.orderId}?token=${token}`
                : `/track/${order.orderId}`;

              const isPending = order.status === 'payment_verification_pending';
              const isDelivered = order.status === 'delivered' || order.status === 'served';

              return (
                <article
                  key={order.orderId}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e8e2d8',
                    padding: '24px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1ece4', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1F2937' }}>
                          #{order.orderId}
                        </h2>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isPending ? '#fff8e6' : isDelivered ? '#e8f8f0' : '#ebf5ff',
                            color: isPending ? '#b45309' : isDelivered ? '#047857' : '#1d4ed8',
                            border: `1px solid ${isPending ? '#fde68a' : isDelivered ? '#a7f3d0' : '#bfdbfe'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {order.statusMeta?.label || order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#6B7280' }}>
                        Placed on {formatDate(order.createdAt)} · {order.orderType === 'delivery' ? '🛵 Doorstep Delivery' : '🍽️ Dine-in / Takeaway'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#F05D23' }}>
                        {formatPrice(order.totals.grandTotalPaise)}
                      </div>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ marginBottom: '18px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(order.items || []).map((item: any, idx: number) => (
                        <li
                          key={`${item.menuItemId}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '14px',
                            color: '#374151',
                          }}
                        >
                          <span>
                            <strong>{item.qty}×</strong> {item.title}
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            {formatPrice(item.lineTotalPaise)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Delivery address if delivery */}
                  {order.deliveryAddress && (
                    <div style={{ fontSize: '12.5px', color: '#6B7280', background: '#faf8f5', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px' }}>
                      <strong style={{ color: '#374151' }}>Delivery to: </strong>
                      {order.deliveryAddress}
                    </div>
                  )}

                  {/* Action Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '14px', borderTop: '1px solid #f1ece4' }}>
                    <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
                      Payment: <strong style={{ color: '#374151' }}>{order.paymentStatus === 'verified' ? '✅ Paid via UPI' : order.customerMarkedPaid ? '⏳ UTR Submitted' : '⚠️ Awaiting Payment'}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Link
                        href={trackHref}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 18px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #F5A623 0%, #F05D23 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(240, 93, 35, 0.25)',
                        }}
                      >
                        <span>Track Live Status</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
