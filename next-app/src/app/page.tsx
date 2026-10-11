'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DishCard from '@/components/DishCard';
import { MENU_DATA, MENU_CATEGORIES } from '@/data/menuData';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

type DishItem = {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  categoryName?: string;
  price?: number;
  pricePaise?: number;
  originalPrice?: number;
  isVeg?: boolean;
  vegNonVeg?: 'veg' | 'non-veg';
  rating?: number;
  reviewsCount?: number;
  badge?: string;
  description?: string;
  image?: string;
  isAvailable?: boolean;
};

export default function HomePage() {
  const { settings } = useStoreSettings();
  const { addToCart } = useCart();

  const [menuItems, setMenuItems] = useState<DishItem[]>(MENU_DATA);
  const [liveCategories, setLiveCategories] = useState<{ id: string; label: string; icon: string; count?: number }[]>(MENU_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc'>('recommended');
  const [displayLimit, setDisplayLimit] = useState(24);

  // Fetch live menu items and categories from database API with client sessionStorage cache
  useEffect(() => {
    let cancelled = false;

    // 1. Instant hydration from sessionStorage if available
    try {
      const cached = sessionStorage.getItem('pm_zaika_menu_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.items) && parsed.items.length > 0 && Date.now() - (parsed.ts || 0) < 300_000) {
          setMenuItems(parsed.items);
          if (Array.isArray(parsed.categories)) {
            setLiveCategories(parsed.categories);
          }
        }
      }
    } catch {
      // sessionStorage unavailable or disabled
    }

    async function fetchLiveMenu() {
      try {
        const res = await fetch(`/api/menu?_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.ok && Array.isArray(data.items) && data.items.length > 0) {
          setMenuItems(data.items);
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            const categoryIcons: Record<string, string> = {
              all: '🍱',
              biryani: '🍛',
              starters: '🍢',
              tandoori: '🍗',
              'veg-curry': '🥦',
              'non-veg-curry': '🥘',
              chinese: '🥢',
              momos: '🥟',
              rolls: '🌯',
              thali: '🍽️',
              breads: '🫓',
              rice: '🍚',
              beverages: '🥤',
              desserts: '🍨',
              soups: '🍲',
            };
            const mappedCats = [
              { id: 'all', label: 'All Dishes', icon: '🍱', count: data.items.length },
              ...data.categories.map((c: { id: string; name?: string; count?: number }) => ({
                id: c.id,
                label: c.name || c.id,
                icon: categoryIcons[c.id.toLowerCase()] || '🍽️',
                count: c.count,
              })),
            ];
            setLiveCategories(mappedCats);

            // Save to sessionStorage for 0-request repeat visits
            try {
              sessionStorage.setItem(
                'pm_zaika_menu_cache',
                JSON.stringify({ items: data.items, categories: mappedCats, ts: Date.now() })
              );
            } catch {}
          }
        }
      } catch {
        // Fallback to static data
      }
    }
    fetchLiveMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for category selection events from the Navbar
  useEffect(() => {
    const handleSelectCategory = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setActiveCategory(custom.detail);
      }
    };
    window.addEventListener('selectCategory', handleSelectCategory);
    return () => window.removeEventListener('selectCategory', handleSelectCategory);
  }, []);

  const filteredDishes = useMemo(() => {
    let list = [...menuItems];

    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }

    if (dietFilter === 'veg') {
      list = list.filter((item) => item.isVeg === true || item.vegNonVeg === 'veg');
    } else if (dietFilter === 'non-veg') {
      list = list.filter((item) => item.isVeg === false || item.vegNonVeg === 'non-veg');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.categoryName && item.categoryName.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => {
        const pA = a.price !== undefined ? a.price : (a.pricePaise || 0) / 100;
        const pB = b.price !== undefined ? b.price : (b.pricePaise || 0) / 100;
        return pA - pB;
      });
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => {
        const pA = a.price !== undefined ? a.price : (a.pricePaise || 0) / 100;
        const pB = b.price !== undefined ? b.price : (b.pricePaise || 0) / 100;
        return pB - pA;
      });
    }

    return list;
  }, [menuItems, activeCategory, dietFilter, searchQuery, sortBy]);

  const visibleDishes = filteredDishes.slice(0, displayLimit);

  const scrollToMenu = (cat?: string) => {
    if (cat) setActiveCategory(cat);
    const el = document.getElementById('menu-showcase');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const heroEyebrow = settings.heroEyebrow || 'Welcome to PM Zaika Restaurant';
  const heroSubtitle =
    settings.heroSubtitle ||
    'Freshly prepared royal delicacies crafted with authentic heritage spices and hand-picked ingredients, designed to indulge your palate every single time.';
  const deliveryTime = settings.estimatedDeliveryTime || '30-45 mins';

  const renderHeroHeadline = () => {
    const custom = settings.heroTitle?.trim();
    if (!custom) {
      return (
        <>
          Giving your Hunger<br />
          <span className="gradient-text-amber">a new Option</span>
        </>
      );
    }
    const words = custom.split(' ');
    if (words.length <= 2) {
      return <span className="gradient-text-amber">{custom}</span>;
    }
    const leading = words.slice(0, -2).join(' ');
    const highlighted = words.slice(-2).join(' ');
    return (
      <>
        {leading}<br />
        <span className="gradient-text-amber">{highlighted}</span>
      </>
    );
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
                <span>{heroEyebrow}</span>
              </div>

              <h1 className="hero-title">
                {renderHeroHeadline()}
              </h1>

              <p className="hero-desc">
                {heroSubtitle}
              </p>

              <div className="hero-buttons">
                <button
                  type="button"
                  onClick={() => scrollToMenu('all')}
                  className="btn-hero-primary"
                >
                  <span>Order Online</span>
                  <div className="btn-icon-circle">🍲</div>
                </button>
                <Link href="/reservation" className="btn-hero-ghost">
                  Book Table
                </Link>
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
                  <div className="stat-number" style={{ fontSize: '20px' }}>
                    {deliveryTime}
                  </div>
                  <span className="stat-label">Avg. Delivery</span>
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

              {/* Multi-Layered Dish Composition (3 Distinct Floating Planes) */}
              <div className="hero-dishes-composition">
                {/* 1. Top-Right Raspberry Plate */}
                <div className="dish-item dish-berries">
                  <img
                    src="/assets/images/hero_plate_berries.webp"
                    alt="Fresh Berry Garnish"
                    className="dish-img"
                    width={200}
                    height={200}
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>

                {/* 2. Center Signature Fresh Salad Platter */}
                <div className="dish-item dish-salad">
                  <img
                    src="/assets/images/hero_plate_salad.webp"
                    alt="Fresh Healthy Salad Platter"
                    className="dish-img"
                    width={400}
                    height={400}
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>

                {/* 3. Bottom-Left Salmon Poke Bowl with Chopsticks */}
                <div className="dish-item dish-salmon">
                  <img
                    src="/assets/images/hero_plate_salmon.webp"
                    alt="Signature Poke Bowl"
                    className="dish-img"
                    width={250}
                    height={250}
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>
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
                  decoding="async"
                  width={400}
                  height={260}
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
                  src="/assets/images/food_butter_curry.webp"
                  alt="Rich Mughlai Main Courses"
                  className="variety-img-inner"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={260}
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
                  src="/assets/images/food_royal_biryani.webp"
                  alt="Authentic Dum Biryani Dinner"
                  className="variety-img-inner"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={260}
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
                  src="/assets/images/food_momos_noodles.webp"
                  alt="Steaming Momos & Hakka Noodles"
                  className="popular-img-content"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={260}
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
                  src="/assets/images/food_butter_curry.webp"
                  alt="Paneer Butter Masala"
                  className="popular-img-content"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={260}
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
                  src="/assets/images/food_tandoori_kebab.webp"
                  alt="Charcoal Tandoori Chicken Tikka"
                  className="popular-img-content"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={260}
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

          {/* Interactive Search & Filter Toolbar */}
          <div className="menu-search-toolbar">
            <div className="menu-search-box">
              <span className="menu-search-box-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDisplayLimit(24);
                }}
                placeholder="Search 300+ dishes, kebabs, biryani, curries..."
                className="menu-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="menu-search-clear"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="menu-filter-controls-right">
              {/* Veg / Non-Veg Toggles */}
              <div className="menu-diet-toggles">
                <button
                  type="button"
                  className={`diet-toggle-btn ${dietFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDietFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`diet-toggle-btn ${dietFilter === 'veg' ? 'active is-veg' : ''}`}
                  onClick={() => setDietFilter('veg')}
                >
                  🌱 Veg Only
                </button>
                <button
                  type="button"
                  className={`diet-toggle-btn ${dietFilter === 'non-veg' ? 'active is-non-veg' : ''}`}
                  onClick={() => setDietFilter('non-veg')}
                >
                  🍗 Non-Veg
                </button>
              </div>

              {/* Price / Popularity Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recommended' | 'price-asc' | 'price-desc')}
                className="menu-sort-select"
              >
                <option value="recommended">Featured / Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="menu-filter-container">
            <div className="menu-filter-track">
              {liveCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`menu-tab-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setDisplayLimit(24);
                  }}
                >
                  <span className="tab-icon">{cat.icon}</span>
                  <span className="tab-label">
                    {cat.label} {cat.count ? `(${cat.count})` : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Meta Counter & Active Filter Reset */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div className="menu-meta-counter" style={{ margin: 0 }}>
              Showing <strong>{filteredDishes.length}</strong> {filteredDishes.length === 1 ? 'dish' : 'dishes'}
              {activeCategory !== 'all' && (
                <span> in <span style={{ color: '#f5a623', fontWeight: 600 }}>{liveCategories.find((c) => c.id === activeCategory)?.label || activeCategory}</span></span>
              )}
              {dietFilter !== 'all' && (
                <span> • <span style={{ color: dietFilter === 'veg' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{dietFilter === 'veg' ? 'Pure Veg' : 'Non-Veg'}</span></span>
              )}
              {searchQuery && (
                <span> matching &ldquo;{searchQuery}&rdquo;</span>
              )}
            </div>

            {(activeCategory !== 'all' || dietFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setDietFilter('all');
                  setSearchQuery('');
                  setDisplayLimit(24);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f5a623',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Dishes Grid */}
          {visibleDishes.length > 0 ? (
            <>
              <div className="dish-luxury-grid" id="menuShowcaseGrid">
                {visibleDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>

              {filteredDishes.length > visibleDishes.length && (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <button
                    type="button"
                    onClick={() => setDisplayLimit((prev) => prev + 24)}
                    className="btn-see-more"
                    style={{ cursor: 'pointer' }}
                  >
                    <span>Load More Dishes ({filteredDishes.length - visibleDishes.length} more)</span>
                    <span className="arrow-circle">↓</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f9fafb',
                borderRadius: '20px',
                border: '1px dashed #e5e7eb',
                margin: '20px 0',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🍽️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                No dishes found
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '420px', margin: '0 auto 18px' }}>
                We couldn&apos;t find any dishes matching your current search or diet criteria. Try clearing some filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setDietFilter('all');
                  setSearchQuery('');
                  setDisplayLimit(24);
                }}
                className="btn-card-action"
                style={{ display: 'inline-flex' }}
              >
                <span>Clear All Filters</span>
                <span className="arrow-box">↺</span>
              </button>
            </div>
          )}
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
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM-2.webp"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
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
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.04-PM.webp"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
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
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.04-PM-1.webp"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
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
                  src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM-1.webp"
                  alt="Verified Diner"
                  className="reviewer-avatar"
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
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
