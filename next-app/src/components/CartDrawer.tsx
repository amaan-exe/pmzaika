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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="cart-title">Your Food Cart</h3>
            {items.length > 0 && (
              <span className="cart-count-pill">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {items.length > 0 && (
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="cart-header-view-btn"
                id="cartDrawerTopViewBtn"
              >
                <span>View Cart</span>
                <span style={{ fontSize: '13px', lineHeight: 1 }}>&rarr;</span>
              </Link>
            )}
            <button
              className="cart-close"
              onClick={closeDrawer}
              aria-label="Close Cart"
            >
              ✕
            </button>
          </div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {/* Primary View Cart button - At the top and most prominent */}
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="btn cart-primary-view-btn"
                id="cartDrawerBottomViewBtn"
              >
                <span style={{ fontSize: '17px' }}>🛒</span>
                <span>View Cart &amp; Checkout</span>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>&rarr;</span>
              </Link>

              {/* Secondary Order on WhatsApp button */}
              <button
                className="btn cart-secondary-whatsapp-btn"
                onClick={checkoutWhatsApp}
                id="cartDrawerWhatsAppBtn"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.128-.521-1.615-.668-2.678-2.316-2.76-2.424-.08-.108-.66-.88-.66-1.678 0-.798.412-1.192.558-1.353.144-.162.313-.203.418-.203.104 0 .209.002.301.007.098.005.228-.037.356.27.133.32.454 1.109.493 1.191.04.081.066.176.013.283-.053.107-.079.175-.157.268-.079.093-.165.207-.235.279-.08.082-.163.171-.07.331.092.161.408.673.876 1.09.601.536 1.108.702 1.268.782.16.081.254.068.349-.041.095-.108.406-.473.515-.635.108-.163.217-.135.362-.081.145.054.919.434 1.077.513.158.079.263.118.302.185.04.066.04.385-.104.79z" />
                </svg>
                <span>Order on WhatsApp</span>
                <span style={{ fontSize: '15px', lineHeight: 1 }}>&rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
