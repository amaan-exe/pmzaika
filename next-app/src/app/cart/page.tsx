'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { MENU_DATA } from '@/data/menuData';
import { api } from '@/lib/client/api';

interface StorefrontSettings {
  deliveryChargePaise: number;
  freeDeliveryAbovePaise: number;
  minimumOrderPaise: number;
  gstPercentage: number;
  isStoreOpen: boolean;
}

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    addToCart,
    placeOrder,
    isPlacingOrder,
    orderError,
  } = useCart();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'dinein'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live pricing + open/closed state come from the backend so the summary can
  // never disagree with what checkout actually charges.
  useEffect(() => {
    let cancelled = false;

    api
      .get<{ settings: StorefrontSettings }>('/api/settings')
      .then(({ settings: loaded }) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  // 4 Top Chef Recommended Dishes for Quick-Add
  const recommendedDishes = [
    {
      id: 'biryani-1',
      name: 'PM Special Hyderabadi Chicken Biryani',
      price: 240,
      image: '/assets/images/food_royal_biryani.jpg',
      tag: 'Bestseller',
      category: 'Royal Biryani',
      isVeg: false,
    },
    {
      id: 'starter-1',
      name: 'Charcoal Tandoori Chicken Kebab',
      price: 250,
      image: '/assets/images/food_tandoori_kebab.jpg',
      tag: 'Clay Oven Special',
      category: 'Tandoori',
      isVeg: false,
    },
    {
      id: 'veg-1',
      name: 'Paneer Butter Masala (Makhani)',
      price: 220,
      image: '/assets/images/food_butter_curry.jpg',
      tag: '100% Pure Veg',
      category: 'Indian Veg Curry',
      isVeg: true,
    },
    {
      id: 'momos-1',
      name: 'Steamed & Fried Chicken Momos',
      price: 140,
      image: '/assets/images/food_momos_noodles.jpg',
      tag: 'Street Delight',
      category: 'Momos & Chinese',
      isVeg: false,
    },
  ];

  /**
   * Checkout hands off to the backend, which re-prices the cart, records the
   * order and returns the tracking link plus a WhatsApp deep link asking the
   * customer to share their UPI payment proof.
   */
  const handleCustomWhatsAppCheckout = async () => {
    if (items.length === 0) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      return;
    }

    try {
      const result = await placeOrder({
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        tableNote: orderType === 'dinein' ? deliveryAddress.trim() : undefined,
        notes: specialNotes.trim() || undefined,
      });

      // Direct user straight to order tracking with payment QR code.
      // WhatsApp redirect is stopped so the customer can pay via UPI first.
      router.push(`/track/${result.orderId}?token=${result.trackingToken}&new=1`);
    } catch {
      // The context already surfaced the message through a toast.
    }
  };

  const isCartEmpty = !mounted ? true : items.length === 0;

  const freeDeliveryThreshold = settings
    ? settings.freeDeliveryAbovePaise / 100
    : 499;
  const standardDeliveryCharge = settings
    ? Math.round(settings.deliveryChargePaise / 100)
    : 29;

  const deliveryFee =
    orderType === 'delivery' && subtotal < freeDeliveryThreshold
      ? standardDeliveryCharge
      : 0;
  const grandTotal = subtotal + deliveryFee;
  const isStoreClosed = settings?.isStoreOpen === false;
  const minimumOrder = settings ? settings.minimumOrderPaise / 100 : 0;
  const meetsMinOrder = minimumOrder === 0 || subtotal >= minimumOrder;
  const missingDetails =
    !customerName.trim() ||
    !customerPhone.trim() ||
    (orderType === 'delivery' && !deliveryAddress.trim());
  const canCheckout = !isPlacingOrder && !isStoreClosed && !missingDetails && meetsMinOrder;

  return (
    <div className="cart-page-wrapper">
      {/* =========================================================================
           CART HERO BANNER
           ========================================================================= */}
      <section className="cart-luxury-banner">
        <div className="container">
          <div className="cart-banner-badge">
            <span className="badge-pulse-dot"></span>
            <span>Fast Patna Doorstep Delivery • Fresh to Order</span>
          </div>
          <h1 className="cart-banner-heading">Your Royal Order</h1>
          <nav className="cart-breadcrumb-trail" aria-label="Breadcrumb">
            <Link href="/" className="crumb-link">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Cart &amp; Checkout</span>
          </nav>
        </div>
      </section>

      {/* =========================================================================
           MAIN CART VIEWPORT
           ========================================================================= */}
      <div className="container cart-content-container">
        {items.length === 0 ? (
          /* =========================================================================
             EMPTY CART STATE (Double-Bezel Architecture + Quick-Add Recommendations)
             ========================================================================= */
          <div className="empty-cart-experience">
            <div className="empty-cart-luxury-card">
              <div className="empty-cloche-frame">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M4 11a8 8 0 0 1 16 0v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z" />
                  <path d="M12 2v2" />
                  <line x1="2" y1="20" x2="22" y2="20" />
                </svg>
              </div>

              <h2 className="empty-card-heading">Your Culinary Cart is Empty</h2>
              <p className="empty-card-subtitle">
                You haven&apos;t added any delicacies yet. Explore our slow-cooked Hyderabadi Dum Biryanis, charcoal tandoori kebabs, and authentic slow-simmered curries to start your feast.
              </p>

              <div className="empty-card-actions">
                <Link href="/#menu-showcase" className="btn-explore-menu">
                  <span>Explore Menu Showcase</span>
                  <span className="btn-arrow-circle">→</span>
                </Link>
              </div>
            </div>

            {/* Quick-Add Recommended Specialties */}
            <div className="cart-recommendations-wrapper">
              <div className="rec-header">
                <div className="rec-eyebrow">CHEF&apos;S RECOMMENDATIONS</div>
                <h3 className="rec-title">Popular Specialties You Might Love</h3>
                <p className="rec-desc">Single-tap additions crafted fresh to satisfy your cravings:</p>
              </div>

              <div className="cart-rec-grid">
                {recommendedDishes.map((dish) => (
                  <div key={dish.id} className="cart-rec-card group">
                    <div className="rec-img-container">
                      <img src={dish.image} alt={dish.name} loading="lazy" />
                      <span className="rec-tag-pill">{dish.tag}</span>
                      <div className={`rec-diet-dot ${dish.isVeg ? 'veg' : 'non-veg'}`}></div>
                    </div>
                    <div className="rec-body">
                      <span className="rec-cat-text">{dish.category}</span>
                      <h4 className="rec-dish-name">{dish.name}</h4>
                      <div className="rec-footer">
                        <span className="rec-dish-price">₹{dish.price}</span>
                        <button
                          type="button"
                          className="btn-quick-add"
                          onClick={() => addToCart(dish.id)}
                          title={`Add ${dish.name} to cart`}
                        >
                          <span>+ Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             ACTIVE CART VIEWPORT (2-Column Luxury Atelier Layout)
             ========================================================================= */
          <div className="active-cart-grid">
            {/* Left Column: Dishes Review */}
            <div className="cart-items-column">
              <div className="cart-items-card">
                <div className="cart-items-header">
                  <div>
                    <h2 className="cart-card-title">Order Items</h2>
                    <span className="cart-items-count">
                      {items.length} {items.length === 1 ? 'delicacy' : 'delicacies'} selected
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="btn-clear-cart"
                    title="Remove all items from cart"
                  >
                    Clear All
                  </button>
                </div>

                <div className="cart-items-list">
                  {items.map((item) => (
                    <div key={item.id} className="cart-item-luxury-row">
                      <div className="item-thumbnail-frame">
                        <img src={item.image} alt={item.name} loading="lazy" />
                      </div>

                      <div className="item-details-box">
                        <div className="item-title-row">
                          <h3 className="item-name">{item.name}</h3>
                          <button
                            type="button"
                            className="btn-item-delete"
                            onClick={() => removeFromCart(item.id)}
                            title="Remove from cart"
                            aria-label={`Remove ${item.name}`}
                          >
                            ✕
                          </button>
                        </div>

                        <div className="item-price-each">₹{item.price} per portion</div>

                        <div className="item-actions-row">
                          <div className="cart-stepper-pill">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="stepper-count">{item.quantity}</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <div className="item-subtotal-price">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions Box */}
                <div className="chef-notes-container">
                  <label htmlFor="chefNotes" className="chef-notes-label">
                    <span>Chef&apos;s Preparation Note (Optional)</span>
                    <span className="optional-tag">Spice Level, Packaging, Cutlery</span>
                  </label>
                  <textarea
                    id="chefNotes"
                    rows={2}
                    className="chef-notes-input"
                    placeholder="E.g. Mild spice, extra green mint chutney, no chopped onions, separate gravy..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                  />
                </div>

                <div className="cart-continue-bar">
                  <Link href="/#menu-showcase" className="btn-continue-shopping">
                    <span>← Add More Royal Delicacies</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout & Bill Summary */}
            <div className="cart-summary-column">
              <div className="cart-summary-sticky-card">
                <h3 className="summary-title">Order Summary</h3>

                {/* Order Type Selector: Delivery or Dine-in */}
                <div className="order-type-switch">
                  <button
                    type="button"
                    className={`order-switch-btn ${orderType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setOrderType('delivery')}
                  >
                    <span>🛵 Home Delivery</span>
                  </button>
                  <button
                    type="button"
                    className={`order-switch-btn ${orderType === 'dinein' ? 'active' : ''}`}
                    onClick={() => setOrderType('dinein')}
                  >
                    <span>🍽️ Dine-in Table</span>
                  </button>
                </div>

                {/* Customer Details Form */}
                <div className="customer-info-fields">
                  <div className="form-group-item">
                    <label htmlFor="custName">Your Name</label>
                    <input
                      type="text"
                      id="custName"
                      placeholder="e.g. Rahul Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="cust-input"
                    />
                  </div>

                  <div className="form-group-item">
                    <label htmlFor="custPhone">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      id="custPhone"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="cust-input"
                    />
                  </div>

                  <div className="form-group-item">
                    <label htmlFor="custAddress">
                      {orderType === 'delivery' ? 'Delivery Address (Patna)' : 'Table Number / Dine-in Notes'}
                    </label>
                    <input
                      type="text"
                      id="custAddress"
                      placeholder={orderType === 'delivery' ? 'House / Flat no, Colony, Landmark' : 'Table 4 / Window Side'}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="cust-input"
                    />
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bill-breakdown-list">
                  <div className="bill-line">
                    <span>Items Subtotal</span>
                    <span className="bill-val">₹{subtotal}</span>
                  </div>
                  <div className="bill-line">
                    <span>Restaurant Packaging</span>
                    <span className="bill-val free-tag">FREE</span>
                  </div>
                  <div className="bill-line">
                    <span>Delivery Fee</span>
                    <span className="bill-val info-tag">
                      {orderType === 'dinein'
                        ? 'Not applicable'
                        : deliveryFee > 0
                          ? `₹${deliveryFee}`
                          : 'FREE'}
                    </span>
                  </div>
                  <div className="bill-line">
                    <span>Taxes &amp; GST</span>
                    <span className="bill-val included-tag">Included in Price</span>
                  </div>

                  <div className="bill-divider"></div>

                  <div className="bill-line total-highlight">
                    <span>Grand Total</span>
                    <span className="total-number">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Primary Place Order & Pay CTA */}
                <button
                  type="button"
                  className="btn-place-order-primary"
                  onClick={handleCustomWhatsAppCheckout}
                  disabled={!canCheckout}
                  id="cartPlaceOrderBtn"
                >
                  <div className="order-btn-icon-circle">
                    <span style={{ fontSize: '20px' }}>⚡</span>
                  </div>
                  <div className="order-btn-text">
                    <span className="btn-main-label">
                      {isPlacingOrder
                        ? 'Placing Your Order…'
                        : isStoreClosed
                          ? 'Restaurant Closed'
                          : 'Place Order & Pay via UPI'}
                    </span>
                    <span className="btn-sub-label">
                      {orderError
                        ? orderError
                        : 'Scan UPI QR on next screen'}
                    </span>
                  </div>
                  <span className="order-arrow-trailing">→</span>
                </button>

                {!meetsMinOrder && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: '#c0392b', textAlign: 'center', fontWeight: 600 }}>
                    Minimum order amount is ₹{minimumOrder}. Add ₹{minimumOrder - subtotal} more to order.
                  </p>
                )}

                {/* Trust Badges */}
                <div className="trust-assurances-row">
                  <div className="trust-item">
                    <span className="trust-icon">⚡</span>
                    <span>Direct Kitchen Connection</span>
                  </div>
                  <div className="trust-item">
                    <span className="trust-icon">🛡️</span>
                    <span>Hygienically Sealed</span>
                  </div>
                  <div className="trust-item">
                    <span className="trust-icon">💵</span>
                    <span>UPI &amp; Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
