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
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
  }>({});
  const [touched, setTouched] = useState<{
    customerName?: boolean;
    customerPhone?: boolean;
    deliveryAddress?: boolean;
  }>({});
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('pm_zaika_customer_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        let filled = false;
        if (parsed.name) { setCustomerName(parsed.name); filled = true; }
        if (parsed.phone) { setCustomerPhone(parsed.phone); filled = true; }
        if (parsed.address) { setDeliveryAddress(parsed.address); filled = true; }
        if (filled) setIsAutoFilled(true);
      }
    } catch {}
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

  const validateForm = () => {
    const errors: { customerName?: string; customerPhone?: string; deliveryAddress?: string } = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = 'Please enter your name (at least 2 characters)';
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    const validPhone = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
    if (!validPhone) {
      errors.customerPhone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    if (orderType === 'delivery' && (!deliveryAddress.trim() || deliveryAddress.trim().length < 5)) {
      errors.deliveryAddress = 'Please enter your complete delivery address in Patna with landmark';
    }

    const isValid = Object.keys(errors).length === 0;
    setFieldErrors(errors);
    if (!isValid) {
      setFormAlert('Please complete all required fields highlighted above before placing order.');
    } else {
      setFormAlert(null);
    }
    return isValid;
  };

  /**
   * Checkout hands off to the backend, which re-prices the cart, records the
   * order and returns the tracking link plus a WhatsApp deep link asking the
   * customer to share their UPI payment proof.
   */
  const handleCustomWhatsAppCheckout = async () => {
    if (items.length === 0) return;

    setTouched({
      customerName: true,
      customerPhone: true,
      deliveryAddress: true,
    });

    if (!validateForm()) {
      const firstInvalid = document.querySelector('.input-has-error');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Auto-save customer details for effortless repeat orders
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
      localStorage.setItem(
        'pm_zaika_customer_info',
        JSON.stringify({
          name: customerName.trim(),
          phone: cleanPhone,
          address: deliveryAddress.trim(),
        })
      );
    } catch {}

    try {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
      const result = await placeOrder({
        orderType,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        tableNote: orderType === 'dinein' ? deliveryAddress.trim() : undefined,
        notes: specialNotes.trim() || undefined,
      });

      // Direct user straight to order tracking with payment QR code.
      // WhatsApp redirect is stopped so the customer can pay via UPI first.
      router.push(`/track/${result.orderId}?token=${result.trackingToken}&new=1`);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not place your order right now. Please check your network connection or try again.';
      setFormAlert(msg);
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
  const canCheckout = !isPlacingOrder && !isStoreClosed && meetsMinOrder;

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

                {/* Customer Details Form with Inline Warnings */}
                <div className="customer-info-fields">
                  {isAutoFilled && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#166534',
                      marginBottom: '12px'
                    }}>
                      <span>✨ Contact details auto-filled from your previous order</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerName('');
                          setCustomerPhone('');
                          setDeliveryAddress('');
                          setIsAutoFilled(false);
                          try { localStorage.removeItem('pm_zaika_customer_info'); } catch {}
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#15803D',
                          textDecoration: 'underline',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <div className="form-group-item">
                    <label htmlFor="custName">
                      Your Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="custName"
                      placeholder="e.g. Rahul Kumar"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (touched.customerName) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            customerName: e.target.value.trim().length >= 2 ? undefined : 'Please enter your name (at least 2 characters)',
                          }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, customerName: true }));
                        if (!customerName.trim() || customerName.trim().length < 2) {
                          setFieldErrors((prev) => ({ ...prev, customerName: 'Please enter your name (at least 2 characters)' }));
                        }
                      }}
                      className={`cust-input ${touched.customerName && fieldErrors.customerName ? 'input-has-error' : ''}`}
                    />
                    {touched.customerName && fieldErrors.customerName && (
                      <p className="field-error-msg">⚠️ {fieldErrors.customerName}</p>
                    )}
                  </div>

                  <div className="form-group-item">
                    <label htmlFor="custPhone">
                      Phone / WhatsApp Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="custPhone"
                      placeholder="e.g. 9876543210 (10 digits)"
                      value={customerPhone}
                      onChange={(e) => {
                        // Clean non-digits and normalize +91 prefixes
                        let clean = e.target.value.replace(/\D/g, '');
                        if (clean.startsWith('91') && clean.length > 10) {
                          clean = clean.slice(2);
                        }
                        if (clean.length > 10) {
                          clean = clean.slice(0, 10);
                        }
                        setCustomerPhone(clean);
                        if (touched.customerPhone) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            customerPhone: clean.length === 10 && /^[6-9]\d{9}$/.test(clean) ? undefined : 'Enter a valid 10-digit Indian mobile number',
                          }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, customerPhone: true }));
                        const clean = customerPhone.replace(/\D/g, '');
                        if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
                          setFieldErrors((prev) => ({ ...prev, customerPhone: 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)' }));
                        }
                      }}
                      className={`cust-input ${touched.customerPhone && fieldErrors.customerPhone ? 'input-has-error' : ''}`}
                    />
                    {touched.customerPhone && fieldErrors.customerPhone && (
                      <p className="field-error-msg">⚠️ {fieldErrors.customerPhone}</p>
                    )}
                  </div>

                  <div className="form-group-item">
                    <label htmlFor="custAddress">
                      {orderType === 'delivery' ? 'Delivery Address (Patna)' : 'Table Number / Dine-in Notes'}{' '}
                      {orderType === 'delivery' && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      id="custAddress"
                      placeholder={orderType === 'delivery' ? 'House / Flat no, Colony, Landmark' : 'Table 4 / Window Side'}
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        if (orderType === 'delivery' && touched.deliveryAddress) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            deliveryAddress: e.target.value.trim().length >= 5 ? undefined : 'Please enter full delivery address with landmark',
                          }));
                        }
                      }}
                      onBlur={() => {
                        if (orderType === 'delivery') {
                          setTouched((prev) => ({ ...prev, deliveryAddress: true }));
                          if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
                            setFieldErrors((prev) => ({ ...prev, deliveryAddress: 'Please enter full delivery address with landmark' }));
                          }
                        }
                      }}
                      className={`cust-input ${orderType === 'delivery' && touched.deliveryAddress && fieldErrors.deliveryAddress ? 'input-has-error' : ''}`}
                    />
                    {orderType === 'delivery' && touched.deliveryAddress && fieldErrors.deliveryAddress && (
                      <p className="field-error-msg">⚠️ {fieldErrors.deliveryAddress}</p>
                    )}
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

                {/* Form Validation Warning Banner */}
                {formAlert && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #EF4444',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#991B1B',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚠️</span>
                    <span>{formAlert}</span>
                  </div>
                )}

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
                    <span>UPI &amp; Instant Verification</span>
                  </div>
                </div>

                {/* Restaurant Warnings & Kitchen Policies */}
                <div className="order-advisories-card">
                  <div className="advisories-header">
                    <span>⚠️ Important Order Notices</span>
                  </div>
                  <div className="advisory-item">
                    <span className="advisory-icon">📍</span>
                    <div className="advisory-text">
                      <strong>Patna Delivery Radius:</strong>
                      <span> Serving within ~8 km radius from Gur Ki Mandi / Shershah Road. Please ensure full address with landmark.</span>
                    </div>
                  </div>
                  <div className="advisory-item">
                    <span className="advisory-icon">👨‍🍳</span>
                    <div className="advisory-text">
                      <strong>Cancellation Policy:</strong>
                      <span> Orders are freshly cooked immediately upon payment verification and cannot be cancelled or modified once preparation begins.</span>
                    </div>
                  </div>
                  <div className="advisory-item">
                    <span className="advisory-icon">🛡️</span>
                    <div className="advisory-text">
                      <strong>Fraud &amp; Payment Security:</strong>
                      <span> Pay only via UPI to official ID <code>pmzaika@ybl</code>. PM Zaika staff will never call to ask for your UPI PIN or OTP.</span>
                    </div>
                  </div>
                  <div className="advisory-item">
                    <span className="advisory-icon">🍲</span>
                    <div className="advisory-text">
                      <strong>Dietary &amp; Freshness Notice:</strong>
                      <span> 100% Fresh, hygienic &amp; authentic royal preparation. Please specify any allergy (nuts, dairy) or spice preferences in Chef Notes.</span>
                    </div>
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
