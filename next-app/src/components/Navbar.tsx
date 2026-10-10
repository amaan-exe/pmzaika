'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openDrawer, openSearch } = useCart();
  const { user, loading, openAuth, signOutUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
            <li className="nav-item">
              <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/#menu-showcase" className="nav-link">
                Order Online
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: '6px', verticalAlign: 'middle', transition: 'transform 0.2s ease' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Link>
              {/* Categories Dropdown Matching index.html */}
              <div className="dropdown-menu">
                <Link href="/#menu-showcase" className="dropdown-item">All Dishes <span>🍱</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Starters & Appetizers <span>🍢</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Royal Biryani <span>🍛</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Tandoori Specials <span>🍗</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Indian Veg Curry <span>🥦</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Indian Non Veg Curry <span>🥘</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Chinese & Noodles <span>🥢</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Steamed & Fried Momos <span>🥟</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Kathi & Egg Rolls <span>🌯</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Tandoori Roti & Naan <span>🫓</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Special Grand Thali <span>🍽️</span></Link>
                <Link href="/#menu-showcase" className="dropdown-item">Desserts & Drinks <span>🍮</span></Link>
              </div>
            </li>
            <li className="nav-item">
              <Link href="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`} id="cartTrigger">
                Cart
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/my-orders" className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`}>
                My Orders
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/reservation" className={`nav-link ${isActive('/reservation') ? 'active' : ''}`}>
                Reservation
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
                Contact-Us
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
                About-Us
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/gallery" className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}>
                Gallery
              </Link>
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
              className="account-btn"
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
              aria-label="Open Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
