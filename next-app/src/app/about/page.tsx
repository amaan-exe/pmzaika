'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      {/* Banner (Matching Screenshot 3: "About Us" / "Home > About Us") */}
      <section className="subpage-banner bg-courier">
        <div className="banner-shape-left"></div>
        <div className="banner-shape-right"></div>
        <div className="container subpage-banner-content">
          <h1 className="subpage-banner-title">About Us</h1>
          <div className="subpage-breadcrumb">
            <Link href="/">Home</Link>
            <span>&gt;</span>
            <span>About-Us</span>
          </div>
        </div>
      </section>

      {/* Section 1: Intro About (Matching Screenshot 3) */}
      <section className="about-intro-section">
        <div className="container">
          <div className="about-intro-grid">
            {/* Left: Logo Box Card */}
            <div>
              <div className="about-logo-box">
                <img
                  src="/assets/images/ChatGPT-Image-Jan-9-2026-06_42_49-PM-1.png"
                  alt="PM Zaika Restaurant Emblem"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right: Description & CTA Buttons */}
            <div>
              <span className="about-tag">ABOUT PM ZAIKA RESTAURANT</span>
              <h2 className="about-heading">PM Zaika Serve the delicious food.</h2>
              <p className="about-desc">
                PM Zaika brings you the perfect blend of taste, quality, and hygiene. From freshly prepared meals to rich traditional flavors, every dish is crafted with love and premium ingredients. Our mission is to serve delicious food that makes every bite memorable.
              </p>
              <div className="about-buttons">
                <Link href="/#menu-showcase" className="btn btn-primary">
                  Our Menu &rarr;
                </Link>
                <Link href="/#menu-showcase" className="btn btn-outline">
                  Order Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 4 Stat Counters (Matching Screenshot 3) */}
      <section className="about-stats-section">
        <div className="container">
          <div className="about-stats-grid">
            {/* Stat 1 */}
            <div className="about-stat-item">
              <img src="/assets/images/icon1_3.png" alt="Satisfaction Customer" className="about-stat-icon" />
              <div className="about-stat-number">
                10 K <span>+</span>
              </div>
              <div className="about-stat-label">Satisfaction Customer</div>
            </div>

            {/* Stat 2 */}
            <div className="about-stat-item">
              <img src="/assets/images/icon2_3.png" alt="Food Delivered" className="about-stat-icon" />
              <div className="about-stat-number">
                2 K <span>+</span>
              </div>
              <div className="about-stat-label">Food Delivered</div>
            </div>

            {/* Stat 3 */}
            <div className="about-stat-item">
              <img src="/assets/images/icon3_3.png" alt="Kitchen Partner" className="about-stat-icon" />
              <div className="about-stat-number">
                5 <span>+</span>
              </div>
              <div className="about-stat-label">Kitchen Partner</div>
            </div>

            {/* Stat 4 */}
            <div className="about-stat-item">
              <img src="/assets/images/icon4_3.png" alt="Experienced Server" className="about-stat-icon" />
              <div className="about-stat-number">
                200 <span>+</span>
              </div>
              <div className="about-stat-label">Experienced Server</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Testimonials (Matching Screenshot 3) */}
      <section className="about-testimonials-section">
        <div className="container">
          <div className="about-testimonials-grid">
            {/* Left: Heading & Description & Button */}
            <div>
              <span className="about-tag">TESTIMONIALS</span>
              <h2 className="about-heading" style={{ fontSize: '36px', marginBottom: '16px' }}>
                What Customers Say About Us.
              </h2>
              <p className="about-desc" style={{ marginBottom: '30px' }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus viverra orci sed risus tincidunt tempor. Nulla malesuada vestibulum nibh.
              </p>
              <a href="#standaloneBottomContactForm" className="btn btn-primary">
                See More &rarr;
              </a>
            </div>

            {/* Right: 2x2 Grid of Testimonial Cards */}
            <div className="about-testimonials-cards">
              {/* Card 1 */}
              <div className="about-testimonial-card">
                <div className="about-testimonial-quote">&ldquo;</div>
                <p className="about-testimonial-text">
                  PM Zaika ne expectations se zyada accha experience diya. Food quality, taste aur presentation sab top class tha. Paisa vasool food.
                </p>
                <div className="about-testimonial-author">
                  <img src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM-1.jpeg" alt="Customer Avatar" />
                  <span>Customer</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="about-testimonial-card">
                <div className="about-testimonial-quote">&ldquo;</div>
                <p className="about-testimonial-text">
                  Mujhe PM Zaika ka taste bahut pasand aaya. Masale balanced the aur taste bilkul fresh tha. Family ke saath ya dosto ke sath order karne ke liye best place.
                </p>
                <div className="about-testimonial-author">
                  <img src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM.jpeg" alt="Customer Avatar" />
                  <span>Customer</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="about-testimonial-card">
                <div className="about-testimonial-quote">&ldquo;</div>
                <p className="about-testimonial-text">
                  Patna me best taste! Fresh aur tasty food mila, biryani aur gravy items lajawab the. Service fast thi aur staff polite tha. Highly recommended.
                </p>
                <div className="about-testimonial-author">
                  <img src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.03-PM.jpeg" alt="Customer Avatar" />
                  <span>Customer</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="about-testimonial-card">
                <div className="about-testimonial-quote">&ldquo;</div>
                <p className="about-testimonial-text">
                  PM Zaika ka khana truly amazing hai. Har bite me great flavor aur quantity bhi perfect thi. Packaging bhi secure aur hygienic thi. Definitely ordering again.
                </p>
                <div className="about-testimonial-author">
                  <img src="/assets/images/WhatsApp-Image-2026-02-03-at-2.39.01-PM.jpeg" alt="Customer Avatar" />
                  <span>Customer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
