'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, checkoutWhatsApp } = useCart();

  return (
    <>
      {/* Cart Banner (Matching Screenshot 1 & cart.html) */}
      <section className="cart-page-banner">
        <div className="banner-shape-left"></div>
        <div className="banner-shape-right"></div>
        <div className="container cart-banner-content">
          <h1 className="cart-banner-title">Cart</h1>
          <div className="cart-breadcrumb">
            <Link href="/">Home</Link>
            <span>&gt;</span>
            <span>Cart</span>
          </div>
        </div>
      </section>

      {/* Cart Content: Empty or Populated */}
      {items.length === 0 ? (
        /* Empty Cart State (Matching Screenshot 1 & 2) */
        <section className="empty-cart-section" id="emptyCartDisplay">
          <div className="container">
            <div className="sad-circle-icon">
              {/* Sad Emoji SVG with Tear drop */}
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="none" stroke="#FFFFFF" strokeWidth="4" />
                {/* Eyes */}
                <circle cx="23" cy="26" r="3.5" fill="#FFFFFF" />
                <circle cx="41" cy="26" r="3.5" fill="#FFFFFF" />
                {/* Sad Mouth Arc */}
                <path d="M21 44 Q32 35 43 44" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                {/* Tear Drop on Left Eye */}
                <path d="M26 31 C26 31, 23 37, 23 39 C23 40.5, 24.3 42, 26 42 C27.7 42, 29 40.5, 29 39 C29 37, 26 31, 26 31 Z" fill="#38BDF8" />
              </svg>
            </div>

            <h2 className="empty-cart-title">Your cart is currently empty!</h2>
            <Link href="/#menu-showcase" className="btn btn-primary" style={{ padding: '12px 32px' }}>
              Browse Delicious Menu →
            </Link>
          </div>
        </section>
      ) : (
        /* Active Cart Table View */
        <section style={{ padding: '60px 0' }}>
          <div className="container" style={{ maxWidth: '840px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-heading)' }}>
                Your Order ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      background: '#FAF7F2',
                      borderRadius: '12px',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-heading)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--accent-orange)', fontWeight: 600 }}>
                          ₹{item.price} each
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                          −
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                          +
                        </button>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '16px', minWidth: '60px', textAlign: 'right' }}>
                        ₹{item.price * item.quantity}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.7 }}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  Subtotal: <span style={{ color: 'var(--accent-orange)' }}>₹{subtotal}</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={checkoutWhatsApp}
                  style={{ background: 'var(--whatsapp-green)', color: '#FFFFFF', padding: '12px 28px' }}
                >
                  Place Order on WhatsApp →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New in Store Section (Matching Screenshot 2 & cart.html) */}
      <section className="new-in-store-section">
        <div className="container">
          <h2 className="new-in-store-title">New in store</h2>

          <div className="store-grid-4">
            {/* Product 1: Placeholder Icon */}
            <div className="store-product-card">
              <div className="store-img-wrapper">
                <img src="/assets/images/woocommerce-placeholder.webp" alt="Product Placeholder" className="placeholder-icon" />
              </div>
              <div className="store-product-name">Product</div>
              <Link href="/#menu-showcase" className="store-read-btn">Read more</Link>
            </div>

            {/* Product 2: Starters Platter */}
            <div className="store-product-card">
              <div className="store-img-wrapper">
                <img src="/assets/images/WhatsApp-Image-2026-02-03-at-8.01.46-PM-1-300x300.jpeg" alt="Chilli Chicken Platter" />
              </div>
              <div className="store-product-name">Product</div>
              <Link href="/#menu-showcase" className="store-read-btn">Read more</Link>
            </div>

            {/* Product 3: Chicken Dish */}
            <div className="store-product-card">
              <div className="store-img-wrapper">
                <img src="/assets/images/WhatsApp-Image-2026-02-03-at-8.01.46-PM-300x300.jpeg" alt="Tikka Chicken Dish" />
              </div>
              <div className="store-product-name">Product</div>
              <Link href="/#menu-showcase" className="store-read-btn">Read more</Link>
            </div>

            {/* Product 4: Red Fries Dish */}
            <div className="store-product-card">
              <div className="store-img-wrapper">
                <img src="/assets/images/WhatsApp-Image-2026-02-03-at-8.01.45-PM-1-300x300.jpeg" alt="Honey Chilli Potato" />
              </div>
              <div className="store-product-name">Product</div>
              <Link href="/#menu-showcase" className="store-read-btn">Read more</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
