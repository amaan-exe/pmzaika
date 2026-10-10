'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function FloatingCartBar() {
  const pathname = usePathname();
  const { totalCount, subtotal, openDrawer } = useCart();

  // Hide on admin routes and cart checkout page
  if (pathname.startsWith('/admin') || pathname === '/cart' || totalCount === 0) {
    return null;
  }

  return (
    <aside
      className="floating-cart-bar"
      onClick={openDrawer}
      role="button"
      tabIndex={0}
      aria-label={`View cart with ${totalCount} items totaling ₹${subtotal}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDrawer();
        }
      }}
    >
      <div className="floating-cart-bar-inner">
        <div className="floating-cart-info">
          <div className="floating-cart-badge">
            <span className="cart-bag-icon">🛍️</span>
            <span className="cart-count-pill">{totalCount}</span>
          </div>
          <div className="floating-cart-text">
            <span className="floating-cart-items-label">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} added
            </span>
            <span className="floating-cart-total-price">₹{subtotal}</span>
          </div>
        </div>

        <button type="button" className="floating-cart-action-btn" tabIndex={-1}>
          <span>View Cart</span>
          <span className="floating-cart-arrow">→</span>
        </button>
      </div>
    </aside>
  );
}
