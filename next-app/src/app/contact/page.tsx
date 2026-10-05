'use client';

import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <>
      {/* Banner (Matching Screenshot 2 & contact.html) */}
      <section className="contact-page-banner">
        <div className="banner-shape-left"></div>
        <div className="banner-shape-right"></div>
        <div className="container contact-banner-content">
          <h1 className="contact-banner-title">Our Contact</h1>
          <div className="contact-breadcrumb">
            <Link href="/">Home</Link>
            <span>&gt;</span>
            <span>Contact</span>
          </div>
        </div>
      </section>

      {/* Main Contact Section (Matching Screenshot 2) */}
      <section className="contact-intro-section">
        <div className="container">
          <div className="contact-intro-grid">
            {/* Left Column: Details */}
            <div>
              <span className="contact-tag">CONTACT</span>
              <h2 className="contact-main-heading">Get In Touch With Us.</h2>
              <p className="contact-main-desc">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus viverra orci sed risus tincidunt tempor. Nulla malesuada vestibulum nibh.
              </p>

              {/* 2 Sub-Columns (Patna-city 800007) */}
              <div className="contact-subgrid">
                {/* Sub-Col 1 */}
                <div>
                  <h3 className="contact-subheading">Patna-city 800007</h3>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">📍</span>
                    <span>PM Zaika Restaurant shersha road,gur ki Mandi,infront of bank of india,patna-800007, Bihar</span>
                  </div>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">✉️</span>
                    <a href="mailto:zaikarestaurant81@gmail.com" style={{ color: 'inherit' }}>zaikarestaurant81@gmail.com</a>
                  </div>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">📞</span>
                    <a href="tel:+917488260572" style={{ color: 'inherit' }}>+91 7488 260 572</a>
                  </div>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">🕒</span>
                    <span>11:00 AM - 10:00 PM</span>
                  </div>
                </div>

                {/* Sub-Col 2 */}
                <div>
                  <h3 className="contact-subheading">Patna-city 800007</h3>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">📍</span>
                    <span>PM Zaika Restaurant shersha road,gur ki Mandi,infront of bank of india,patna-800007, Bihar</span>
                  </div>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">✉️</span>
                    <a href="mailto:zaikarestaurant81@gmail.com" style={{ color: 'inherit' }}>zaikarestaurant81@gmail.com</a>
                  </div>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">📞</span>
                    <a href="tel:+917488260572" style={{ color: 'inherit' }}>+91 7488 260 572</a>
                  </div>
                  <div className="contact-item-row">
                    <span className="contact-item-icon">🕒</span>
                    <span>11:00 AM - 10:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Logo Box Card (Matching Screenshot 2) */}
            <div>
              <div className="contact-logo-box">
                <img
                  src="/assets/images/ChatGPT-Image-Jan-9-2026-06_42_49-PM-1.png"
                  alt="PM Zaika Restaurant Crest"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Google Maps Embed for Patna Area (Matching Screenshot 2) */}
          <div className="contact-map-wrapper">
            <iframe
              title="PM Zaika Patna Map Location"
              src="https://maps.google.com/maps?q=PM%20Zaika%20Restaurant,%20Shersha%20Road,%20Gur%20Ki%20Mandi,%20Patna%20City&t=&z=14&ie=UTF8&iwloc=&output=embed"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>

          {/* Centered Night Exterior Photo of Restaurant (Matching Screenshot 2) */}
          <div className="contact-building-wrapper">
            <img
              src="/assets/images/zk-768x442.jpeg"
              alt="PM Zaika Restaurant Building Exterior"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
