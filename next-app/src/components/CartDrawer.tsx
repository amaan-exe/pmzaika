'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeFromCart,
    subtotal,
    checkoutWhatsApp,
  } = useCart();

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isDrawerOpen ? 'active' : ''}`}
        onClick={closeDrawer}
      ></div>

      {/* Slide-in Drawer */}
      <div className={`cart-drawer ${isDrawerOpen ? 'active' : ''}`}>
        <div className="cart-header">
          <h3 className="cart-title">Your Food Cart</h3>
          <button
            className="cart-close"
            onClick={closeDrawer}
            aria-label="Close Cart"
          >
            ✕
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-cart-icon">🛒</div>
              <p className="empty-cart-text">Your cart is currently empty</p>
              <button
                className="btn btn-primary"
                onClick={closeDrawer}
                style={{ marginTop: '16px' }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="cart-item" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-img"
                    style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div className="cart-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="cart-item-title" style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                    <div className="cart-item-price" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '8px' }}>₹{item.price} each</div>
                    <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="qty-controls" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '6px', background: '#FFFFFF' }}>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                          style={{ width: '26px', height: '26px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                        >
                          −
                        </button>
                        <span className="qty-number" style={{ padding: '0 8px', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                          style={{ width: '26px', height: '26px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="item-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Subtotal:</span>
              <span className="summary-val">₹{subtotal}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery:</span>
              <span className="summary-val" style={{ color: 'var(--whatsapp-green)' }}>
                Free / Calculated on WhatsApp
              </span>
            </div>
            <div className="cart-summary-row total-row">
              <span>Total Amount:</span>
              <span className="summary-val total-price">₹{subtotal}</span>
            </div>

            <button
              className="btn cart-order-btn"
              onClick={checkoutWhatsApp}
            >
              Order on WhatsApp →
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                href="/cart"
                onClick={closeDrawer}
                style={{ fontSize: '13px', color: 'var(--accent-orange)', fontWeight: 600 }}
              >
                View Full Cart Page &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
