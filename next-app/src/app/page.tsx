'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DishCard from '@/components/DishCard';
import HeroDancingPlates from '@/components/HeroDancingPlates';
import { MENU_DATA, MENU_CATEGORIES } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { addToCart } = useCart();

  const filteredDishes =
    activeCategory === 'all'
      ? MENU_DATA
      : MENU_DATA.filter((dish) => dish.category === activeCategory);

  const scrollToMenu = (cat?: string) => {
    if (cat) setActiveCategory(cat);
    const el = document.getElementById('menu-showcase');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* =========================================================================
           HERO SECTION (LUXURY CULINARY ATELIER & FLOATING PLATTER PHYSICS)
           ========================================================================= */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            {/* Left Hero Content */}
            <div className="hero-content">
              <div className="eyebrow-pill">
                <span className="eyebrow-dot"></span>
                <span>Welcome to PM Zaika Restaurant</span>
              </div>

              <h1 className="hero-title">
                Giving your Hunger<br />
                <span className="gradient-text-amber">a new Option</span>
              </h1>

              <p className="hero-desc">
                Freshly prepared royal delicacies crafted with authentic heritage spices and hand-picked ingredients, designed to indulge your palate every single time.
              </p>

              <div className="hero-buttons">
                <Link href="/reservation" className="btn-hero-primary">
                  <span>Make Reservation</span>
                  <div className="btn-icon-circle">→</div>
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToMenu('all')}
                  className="btn-hero-ghost"
                >
                  Order Online
                </button>
              </div>

              <div className="hero-stats-bar">
                <div className="stat-box">
                  <div className="stat-number">
                    10 K<span className="stat-plus">+</span>
                  </div>
                  <span className="stat-label">Satisfied Diners</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-box">
                  <div className="stat-number">
                    8 K<span className="stat-plus">+</span>
                  </div>
                  <span className="stat-label">Dishes Delivered</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Concentric Arches + 3 Layered Floating Dishes */}
            <div className="hero-visual">
              <div className="hero-blob-bg">
                <svg viewBox="0 0 540 540" fill="none" className="hero-arch-svg" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Arch */}
                  <path d="M 15 525 A 255 255 0 0 1 525 525 Z" fill="#EF9C58" />
                  {/* Inner Concentric Arch */}
                  <path d="M 90 525 A 180 180 0 0 1 450 525 Z" fill="#EC7851" />
                  {/* White Curved Arc Line Slicing Across */}
                  <path d="M -20 540 Q 270 420 560 390" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2.8" strokeLinecap="round" />
                </svg>
              </div>

              {/* GSAP Dancing Plates Composition (3 Distinct Floating Planes) */}
              <HeroDancingPlates />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
           SECTION: VARIETY OF FOOD (3 BENTO LUXURY CARDS)
           ========================================================================= */}
      <section className="section-variety">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">CURATED FLAVORS</div>
            <h2 className="section-title">Choose the variety of food you like.</h2>
            <p className="section-subtitle">
              From charcoal-smoked tandoori starters to rich Mughlai gravies, discover signature recipes tailored for every culinary craving.
            </p>
          </div>

          <div className="cards-grid-3">
            {/* Card 1: Starters */}
            <div className="variety-luxury-card group">
              <div className="variety-img-outer">
                <img
                  src="/assets/images/image1.webp"
                  alt="Tandoori Starters & Appetizers"
                  className="variety-img-inner"
                  loading="lazy"
                />
                <span className="variety-tag-pill">Appetizers</span>
              </div>
              <div className="variety-card-details">
                <h3 className="variety-heading">Starters & Kebabs</h3>
                <p className="variety-text">
                  Crispy, succulent starters made fresh with aromatic clay-oven spices and bold marinades. The quintessential prologue to your feast.
                </p>
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={() => scrollToMenu('starters')}
                >
                  <span>Order Starters</span>
                  <span className="arrow-box">→</span>
                </button>
              </div>
            </div>

            {/* Card 2: Main Courses */}
            <div className="variety-luxury-card group">
              <div className="variety-img-outer">
                <img
                  src="/assets/images/food_butter_curry.jpg"
                  alt="Rich Mughlai Main Courses"
                  className="variety-img-inner"
                  loading="lazy"
                />
                <span className="variety-tag-pill">Main Feast</span>
              </div>
              <div className="variety-card-details">
                <h3 className="variety-heading">Main Courses</h3>
                <p className="variety-text">
                  Rich, velvety curries simmered in sealed pots with fresh churned butter, cashews, and aromatic spices. Perfect with warm tandoori naans.
                </p>
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={() => scrollToMenu('veg-curry')}
                >
                  <span>Explore Curries</span>
                  <span className="arrow-box">→</span>
                </button>
              </div>
            </div>

            {/* Card 3: Royal Biryani Dinner */}
            <div className="variety-luxury-card group">
              <div className="variety-img-outer">
                <img
                  src="/assets/images/food_royal_biryani.jpg"
                  alt="Authentic Dum Biryani Dinner"
                  className="variety-img-inner"
                  loading="lazy"
                />
                <span className="variety-tag-pill">Royal Dum</span>
              </div>
              <div className="variety-card-details">
                <h3 className="variety-heading">Royal Biryani</h3>
                <p className="variety-text">
                  Aged long-grain basmati rice layered with succulent saffron chicken, caramelized onions, and whole spices, slow-cooked in handi.
                </p>
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={() => scrollToMenu('biryani')}
                >
                  <span>Order Biryani</span>
                  <span className="arrow-box">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
           SECTION: POPULAR FOOD / GOOD FOOD IN YOUR AREA
           ========================================================================= */}
      <section className="section-popular">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">POPULAR SPECIALTIES</div>
            <h2 className="section-title">Good Food in Your Area.</h2>
            <p className="section-subtitle">
              Highest-rated dishes loved by thousands of diners across Patna City every single day.
            </p>
          </div>

          <div className="cards-grid-3">
            {/* Card 1: Fast Food & Momos */}
            <div className="popular-luxury-card group">
              <div className="popular-img-frame">
                <img
                  src="/assets/images/food_momos_noodles.jpg"
                  alt="Steaming Momos & Hakka Noodles"
                  className="popular-img-content"
                  loading="lazy"
                />
                <div className="popular-badge-overlay">
                  <span>Fast Food & Chinese</span>
                </div>
              </div>
              <div className="popular-card-body">
                <div className="popular-meta-line">
                  <span className="popular-cuisine-tag">Street Delights</span>
                  <span className="popular-star-tag">★ 4.9 (170+)</span>
                </div>
                <h3 className="popular-card-name">Steamed & Fried Momos</h3>
                <p className="popular-card-desc">
                  Translucent handcrafted dumplings served piping hot with fiery red garlic dip, accompanied by sizzling wok noodles.
                </p>
                <div className="popular-footer-bar">
                  <span className="popular-price-label">Starts at ₹130</span>
                  <button
                    type="button"
                    className="btn-popular-order"
                    onClick={() => addToCart('momos-1')}
                  >
                    <span>Place Order</span>
                    <span className="order-plus">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Pure Veg Delights */}
            <div className="popular-luxury-card group">
              <div className="popular-img-frame">
                <img
                  src="/assets/images/food_butter_curry.jpg"
                  alt="Paneer Butter Masala"
                  className="popular-img-content"
                  loading="lazy"
                />
                <div className="popular-badge-overlay veg-tag">
                  <span>100% Pure Veg</span>
                </div>
              </div>
              <div className="popular-card-body">
                <div className="popular-meta-line">
                  <span className="popular-cuisine-tag">North Indian</span>
                  <span className="popular-star-tag">★ 4.8 (165+)</span>
                </div>
                <h3 className="popular-card-name">Paneer Butter Masala</h3>
                <p className="popular-card-desc">
                  Fresh malai cottage cheese cubes simmered in creamy tomato-cashew satin gravy with fragrant crushed fenugreek.
                </p>
                <div className="popular-footer-bar">
                  <span className="popular-price-label">Starts at ₹220</span>
                  <button
                    type="button"
                    className="btn-popular-order"
                    onClick={() => addToCart('veg-1')}
                  >
                    <span>Place Order</span>
                    <span className="order-plus">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Non-Veg Special */}
            <div className="popular-luxury-card group">
              <div className="popular-img-frame">
                <img
                  src="/assets/images/food_tandoori_kebab.jpg"
                  alt="Charcoal Tandoori Chicken Tikka"
                  className="popular-img-content"
                  loading="lazy"
                />
                <div className="popular-badge-overlay special-tag">
                  <span>Signature Special</span>
                </div>
              </div>
              <div className="popular-card-body">
                <div className="popular-meta-line">
                  <span className="popular-cuisine-tag">Tandoori Clay Oven</span>
                  <span className="popular-star-tag">★ 4.9 (184+)</span>
                </div>
                <h3 className="popular-card-name">Charcoal Tandoori Kebab</h3>
                <p className="popular-card-desc">
                  Succulent chicken skewers marinated in mustard oil, roasted gram flour, and Kashmiri chili, charred over hot coals.
                </p>
                <div className="popular-footer-bar">
                  <span className="popular-price-label">Starts at ₹250</span>
                  <button
                    type="button"
                    className="btn-popular-order"
                    onClick={() => addToCart('starter-1')}
                  >
                    <span>Place Order</span>
                    <span className="order-plus">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
           SECTION: HOW DOES IT WORK (MODERN 4-STEP BENTO)
           ========================================================================= */}
      <section className="section-emperor">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">SEAMLESS DINING</div>
            <h2 className="section-title">Get served as an emperor.</h2>
            <p className="section-subtitle">
              Effortless ordering, express doorstep delivery, and royal table reservations designed around your comfort.
            </p>
          </div>

          <div className="cards-grid-4">
            {/* Step 1 */}
            <div className="step-card group">
              <div className="step-badge-number">01</div>
              <div className="step-icon-circle">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>
              <h3 className="step-card-title">1. Place Order</h3>
              <p className="step-card-text">
                Browse our curated menu, customize spice levels, and add dishes to your cart with a single click.
              </p>
              <button
                type="button"
                onClick={() => scrollToMenu('all')}
                className="step-link"
              >
                <span>View Menu</span>
                <span>→</span>
              </button>
            </div>

            {/* Step 2 */}
            <div className="step-card group">
              <div className="step-badge-number">02</div>
              <div className="step-icon-circle">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <h3 className="step-card-title">2. Fast Checkout</h3>
              <p className="step-card-text">
                Instant order confirmation via WhatsApp with live kitchen updates, UPI, and cash-on-delivery options.
              </p>
              <Link href="/contact" className="step-link">
                <span>Payment FAQs</span>
                <span>→</span>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="step-card group">
              <div className="step-badge-number">03</div>
              <div className="step-icon-circle">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="step-card-title">3. Table Reservation</h3>
              <p className="step-card-text">
                Reserve your family dining table or VIP lounge in advance with zero wait time and guaranteed seating.
              </p>
              <Link href="/reservation" className="step-link">
                <span>Book Table</span>
                <span>→</span>
              </Link>
            </div>

            {/* Step 4 */}
            <div className="step-card group">
              <div className="step-badge-number">04</div>
              <div className="step-icon-circle">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="step-card-title">4. Dine & Review</h3>
              <p className="step-card-text">
                Relish authentic flavors, enjoy royal hospitality, and share your memorable review with the community.
              </p>
              <a href="#testimonials" className="step-link">
                <span>Guest Reviews</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
           SECTION: INTERACTIVE MENU SHOWCASE (THE BALANCED 3-COLUMN GRID)
           ========================================================================= */}
      <section className="section-menu-showcase" id="menu-showcase">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">AUTHENTIC KITCHEN</div>
            <h2 className="section-title">Order Your Favorites Online</h2>
            <p className="section-subtitle">
              Every dish is freshly prepared to order using authentic slow-cooking techniques and farm-fresh ingredients.
            </p>
          </div>

          {/* Filter Pills Bar */}
          <div className="menu-filter-container">
            <div className="menu-filter-track">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`menu-tab-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="tab-icon">{cat.icon}</span>
                  <span className="tab-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Grid: Guaranteed 3-Column Luxury Architecture */}
          <div className="dish-luxury-grid" id="menuShowcaseGrid">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
           SECTION: TESTIMONIALS (2x2 LUXURY EDITORIAL GRID)
           ========================================================================= */}
      <section className="section-testimonials" id="testimonials">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">GUEST EXPERIENCES</div>
            <h2 className="section-title">What Customers Say About Us.</h2>
            <p className="section-subtitle">Real experiences and authentic reviews from our valued diners in Patna.</p>
          </div>

          <div className="testimonials-luxury-grid">
            {/* Review 1 */}
            <div className="testimonial-luxury-card">
              <div className="quote-top-row">
                <span className="stars-gold">★★★★★</span>
                <span className="quote-mark">“</span>
              </div>
              <p className="testimonial-quote-body">
                Food taste was amazing! Chicken Biryani was full of flavor and perfectly cooked. Highly recommended for family dinners.
              </p>
              <div className="reviewer-profile-bar">
                <img
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM-2.jpeg"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                />
                <div>
                  <div className="reviewer-name">Amit Kumar</div>
                  <div className="reviewer-badge-verified">Verified Diner · Patna City</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="testimonial-luxury-card">
              <div className="quote-top-row">
                <span className="stars-gold">★★★★★</span>
                <span className="quote-mark">“</span>
              </div>
              <p className="testimonial-quote-body">
                Best restaurant in this area. Fresh food, generous portions, and lightning-fast service. Their Paneer Butter Masala is heavenly!
              </p>
              <div className="reviewer-profile-bar">
                <img
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.04-PM.jpeg"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                />
                <div>
                  <div className="reviewer-name">Rahul Sharma</div>
                  <div className="reviewer-badge-verified">Verified Diner · Gur Ki Mandi</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="testimonial-luxury-card">
              <div className="quote-top-row">
                <span className="stars-gold">★★★★★</span>
                <span className="quote-mark">“</span>
              </div>
              <p className="testimonial-quote-body">
                Very good food at reasonable prices. Definitely ordering again. PM Zaika never disappoints—great taste, high hygiene, and courteous staff.
              </p>
              <div className="reviewer-profile-bar">
                <img
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.04-PM-1.jpeg"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                />
                <div>
                  <div className="reviewer-name">Priya Singh</div>
                  <div className="reviewer-badge-verified">Verified Diner · Shershah Road</div>
                </div>
              </div>
            </div>

            {/* Review 4 */}
            <div className="testimonial-luxury-card">
              <div className="quote-top-row">
                <span className="stars-gold">★★★★★</span>
                <span className="quote-mark">“</span>
              </div>
              <p className="testimonial-quote-body">
                Loved the quality and presentation. You can truly feel the authentic taste in every bite. The Tandoori Chicken is charred to perfection.
              </p>
              <div className="reviewer-profile-bar">
                <img
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM-1.jpeg"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                />
                <div>
                  <div className="reviewer-name">Vikram Malhotra</div>
                  <div className="reviewer-badge-verified">Verified Diner · Patna</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/about" className="btn-see-more">
              <span>Read More Reviews</span>
              <span className="arrow-circle">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
