'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openDrawer, openSearch } = useCart();
  const { user, loading, openAuth, signOutUser } = useAuth();
  const { settings, isOpen } = useStoreSettings();
  const [dismissedText, setDismissedText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('pm_zaika_dismissed_announcement');
      if (stored) setDismissedText(stored);
    } catch {
      // Ignore
    }
  }, []);

  const isAnnouncementVisible =
    Boolean(settings.announcement?.enabled && settings.announcement?.text) &&
    dismissedText !== settings.announcement?.text;

  const handleDismissAnnouncement = () => {
    if (settings.announcement?.text) {
      setDismissedText(settings.announcement.text);
      try {
        sessionStorage.setItem('pm_zaika_dismissed_announcement', settings.announcement.text);
      } catch {
        // Ignore
      }
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [dropdownClosed, setDropdownClosed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setDropdownClosed(false);
  }, [pathname]);

  const handleCategorySelect = (categorySlug?: string) => {
    // 1. Close mobile drawer and accordion immediately
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    // 2. Hide desktop dropdown immediately
    setDropdownClosed(true);
    // 3. Blur element
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }
    // 4. Smoothly scroll to menu section
    const el = document.getElementById('menu-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    // 5. Notify page to activate the chosen category tab
    if (categorySlug && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('selectCategory', { detail: categorySlug }));
    }
  };

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
      {/* Top Announcement Bar from Admin Desk */}
      {isAnnouncementVisible && settings.announcement?.text && (
        <aside
          className={`site-announcement-bar announcement--${settings.announcement.type || 'info'} ${
            settings.announcement.marquee ? 'announcement--marquee' : ''
          }`}
          role="banner"
          aria-label="Restaurant Announcement"
        >
          <div className="container announcement-bar-inner">
            <div className="announcement-bar-content">
              <span className="announcement-bar-icon-wrap" aria-hidden="true">
                <span className="announcement-bar-icon">
                  {settings.announcement.type === 'urgent'
                    ? '🚨'
                    : settings.announcement.type === 'warning'
                    ? '⚠️'
                    : settings.announcement.type === 'success'
                    ? '🎉'
                    : '📢'}
                </span>
                {settings.announcement.type === 'urgent' && <span className="announcement-pulse-dot" />}
              </span>

              {settings.announcement.highlightBadge && (
                <span className="announcement-highlight-badge">
                  {settings.announcement.highlightBadge}
                </span>
              )}

              {settings.announcement.marquee ? (
                <div className="announcement-marquee-wrapper">
                  <div className="announcement-marquee-track">
                    <span className="announcement-bar-text">{settings.announcement.text}</span>
                    <span className="announcement-bar-text" aria-hidden="true">
                      {settings.announcement.text}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="announcement-bar-text">{settings.announcement.text}</span>
              )}

              {settings.announcement.linkUrl && (
                <Link
                  href={settings.announcement.linkUrl}
                  className="announcement-cta-btn"
                  prefetch={false}
                >
                  <span>{settings.announcement.linkLabel || 'View Details'}</span>
                  <span className="announcement-cta-arrow" aria-hidden="true">↗</span>
                </Link>
              )}
            </div>

            <button
              type="button"
              className="announcement-bar-close"
              onClick={handleDismissAnnouncement}
              aria-label="Dismiss announcement"
              title="Dismiss announcement"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </aside>
      )}

      {/* Kitchen Closed Banner if store is offline */}
      {!isOpen && (
        <div className="site-closed-bar">
          <div className="container closed-bar-inner">
            <span>🔴 Kitchen is currently closed for live orders. Table reservations & menu browsing are open!</span>
            {settings.openingTime && <span className="closed-bar-time">Opens: {settings.openingTime}</span>}
          </div>
        </div>
      )}

      {/* Live Operational Notice Bar when open (if no custom announcement is active) */}
      {isOpen && !isAnnouncementVisible && (
        <div className="site-operating-notice-bar">
          <div className="container operating-notice-inner">
            <span className="notice-item-status">🟢 <strong>Kitchen Open</strong><span className="notice-desk-only"> for Live Delivery • Patna Doorstep (35–45m)</span></span>
            <span className="notice-sep">•</span>
            <span className="notice-item-delivery">🛵 Free Delivery above ₹499</span>
            <span className="notice-sep notice-desk-only">•</span>
            <span className="notice-item-extra notice-desk-only">✨ Authentic Royal Delicacies</span>
          </div>
        </div>
      )}

      <div className="container">
        <nav className="navbar">
          {/* Brand Logo */}
          <Link href="/" className="brand-logo" title="PM Zaika Restaurant">
            <img
              src="/assets/images/pm_zaika_circular_logo.png"
              alt="PM Zaika Restaurant Logo"
              width={64}
              height={64}
            />
          </Link>

          {/* Main Navigation Links */}
          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navLinks">
            {/* Mobile Drawer User Card */}
            <li className="mobile-drawer-user-card">
              {user ? (
                <div className="mobile-user-profile">
                  <div className="mobile-user-avatar">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="mobile-user-info">
                    <span className="mobile-user-name">
                      {user.displayName || user.email?.split('@')[0] || 'Valued Guest'}
                    </span>
                    <span className="mobile-user-email">{user.email}</span>
                  </div>
                  <button
                    type="button"
                    className="mobile-signout-btn"
                    onClick={() => {
                      signOutUser();
                      setMobileMenuOpen(false);
                    }}
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mobile-signin-banner-btn"
                  onClick={() => {
                    openAuth();
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="signin-star">✨</span>
                  <span>Sign in / Create Account</span>
                  <span className="signin-arrow">→</span>
                </button>
              )}
            </li>

            <li className="nav-item">
              <Link
                href="/"
               
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">🏠</span>
                <span>Home</span>
              </Link>
            </li>

            <li
              className="nav-item"
              onMouseEnter={() => setDropdownClosed(false)}
              onMouseLeave={() => setDropdownClosed(false)}
            >
              <div className="nav-link-with-toggle">
                <Link
                  href="/#menu-showcase"
                  prefetch={false}
                  className="nav-link"
                  onClick={() => handleCategorySelect()}
                >
                  <span className="mobile-nav-icon">🍛</span>
                  <span>Order Online</span>
                  <svg
                    className="desktop-arrow"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'inline-block', marginLeft: '6px', verticalAlign: 'middle', transition: 'transform 0.2s ease' }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </Link>
                {/* Mobile accordion toggle button */}
                <button
                  type="button"
                  className="mobile-dropdown-arrow"
                  aria-label="Toggle categories menu"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMobileCategoriesOpen(!mobileCategoriesOpen);
                  }}
                >
                  <span className="category-count-badge">12</span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: mobileCategoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>

              {/* Categories Dropdown Matching index.html */}
              <div className={`dropdown-menu ${mobileCategoriesOpen ? 'mobile-expanded' : ''} ${dropdownClosed ? 'dropdown-force-closed' : ''}`}>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('all')}>All Dishes <span>🍱</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('starters')}>Starters & Appetizers <span>🍢</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('biryani')}>Royal Biryani <span>🍛</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('tandoori')}>Tandoori Specials <span>🍗</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('veg-curry')}>Indian Veg Curry <span>🥦</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('non-veg-curry')}>Indian Non Veg Curry <span>🥘</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('chinese')}>Chinese & Noodles <span>🥢</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('momos')}>Steamed & Fried Momos <span>🥟</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('rolls')}>Kathi & Egg Rolls <span>🌯</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('breads')}>Tandoori Roti & Naan <span>🫓</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('thali')}>Special Grand Thali <span>🍽️</span></Link>
                <Link href="/#menu-showcase" prefetch={false} className="dropdown-item" onClick={() => handleCategorySelect('desserts')}>Desserts & Drinks <span>🍮</span></Link>
              </div>
            </li>

            <li className="nav-item">
              <Link href="/cart" prefetch={false} className={`nav-link ${isActive('/cart') ? 'active' : ''}`} id="cartTrigger" onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">🛒</span>
                <span>Cart</span>
                {mounted && totalCount > 0 && (
                  <span className="mobile-drawer-badge">{totalCount}</span>
                )}
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/my-orders" prefetch={false} className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">📦</span>
                <span>My Orders</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/reservation" prefetch={false} className={`nav-link ${isActive('/reservation') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">🍷</span>
                <span>Table Reservation</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/contact" prefetch={false} className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">📍</span>
                <span>Contact & Location</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/about" prefetch={false} className={`nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">👑</span>
                <span>Our Heritage</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/gallery" prefetch={false} className={`nav-link ${isActive('/gallery') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <span className="mobile-nav-icon">📸</span>
                <span>Food Gallery</span>
              </Link>
            </li>

            {/* Mobile Drawer Footer Info */}
            <li className="mobile-drawer-footer">
              <div className="mobile-footer-status">
                <span className="status-dot"></span>
                <span>{isOpen ? 'Kitchen Open for Orders' : 'Kitchen Closed'}</span>
              </div>
              {settings.supportPhone && (
                <a
                  href={`tel:${settings.supportPhone}`}
                  className="mobile-footer-call-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>📞 Call: {settings.supportPhone}</span>
                </a>
              )}
            </li>
          </ul>

          {/* Action Tools: Search & Cart Button */}
          <div className="header-actions">
            <button
              className="icon-btn"
              id="searchTrigger"
              title="Search Dishes"
              aria-label="Search Dishes"
              onClick={openSearch}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            
            <button
              className="icon-btn"
              onClick={openDrawer}
              title="View Cart"
              aria-label="Shopping Cart"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {mounted && totalCount > 0 && (
                <span className="badge-count" id="cartBadge">
                  {totalCount}
                </span>
              )}
            </button>

            <button
              className="account-btn desktop-only-account"
              type="button"
              onClick={user ? signOutUser : openAuth}
              title={user ? `Signed in as ${user.email} (Click to sign out)` : 'Sign in to PM Zaika'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>{loading ? 'Account' : user ? 'Sign out' : 'Sign in'}</span>
            </button>

            {/* Mobile Toggle */}
            <button
              className="mobile-toggle"
              id="mobileToggle"
              aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (mobileMenuOpen) setMobileCategoriesOpen(false);
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => {
            setMobileMenuOpen(false);
            setMobileCategoriesOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
