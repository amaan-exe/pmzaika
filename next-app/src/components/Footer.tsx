'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="site-footer-dark" id="contact">
      {/* Organic Orange Accent Curves */}
      <div className="footer-shape-tr"></div>
      <div className="footer-shape-bl"></div>

      <div className="container footer-content-relative">
        <div className="footer-grid-dark">
          {/* Col 1: Brand Info */}
          <div>
            <img
              src="/assets/images/pm_zaika_circular_logo.png"
              alt="PM Zaika Logo"
              className="footer-logo-img"
              width={82}
              height={82}
            />
            <p className="footer-desc-dark">
              PM Zaika Restaurant serves delicious, freshly prepared food with authentic flavors and quality ingredients. Perfect for family dining, takeaway, and online orders.
            </p>
          </div>

          {/* Col 2: Get In Touch */}
          <div>
            <h3 className="footer-title-white">Get In Touch</h3>
            <ul className="footer-contact-dark">
              <li className="contact-item-dark">
                <span>📍</span>
                <span>PM Zaika Restaurant shersha road,gur ki Mandi,infront of bank of india,patna-800007, Bihar</span>
              </li>
              <li className="contact-item-dark">
                <span>✉️</span>
                <a href="mailto:zaikarestaurant81@gmail.com" style={{ color: '#D1D5DB' }}>
                  zaikarestaurant81@gmail.com
                </a>
              </li>
              <li className="contact-item-dark">
                <span>📞</span>
                <a href="tel:+917488260572" style={{ color: '#D1D5DB' }}>
                  +91 7488 260 572
                </a>
              </li>
              <li className="contact-item-dark">
                <span>🕒</span>
                <span>11:00 AM - 10:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quicklinks */}
          <div>
            <h3 className="footer-title-white">Quicklinks</h3>
            <ul className="footer-links-dark">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#menu-showcase" prefetch={false}>Order Online &#9662;</Link></li>
              <li><Link href="/cart">Cart</Link></li>
              <li><Link href="/reservation">Reservation</Link></li>
              <li><Link href="/contact">Contact-Us</Link></li>
              <li><Link href="/about">About-Us</Link></li>
              <li><Link href="/gallery">Gallery</Link></li>
            </ul>
          </div>

          {/* Col 4: Follow Us */}
          <div>
            <h3 className="footer-title-white">Follow Us</h3>
            <div className="footer-social-circles">
              <a href="https://facebook.com" className="social-circle-dark" title="Facebook" target="_blank" rel="noopener noreferrer">f</a>
              <a href="https://twitter.com" className="social-circle-dark" title="Twitter" target="_blank" rel="noopener noreferrer">t</a>
              <a href="https://instagram.com" className="social-circle-dark" title="Instagram" target="_blank" rel="noopener noreferrer">ig</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-dark">
          <div>Copyright © 2021 ASK Project</div>
          <div>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Shipping Policy</Link>
            <Link href="#">Refund Policy</Link>
            <Link href="#">Terms & Services</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
