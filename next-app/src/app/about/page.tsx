'use client';

import React from 'react';
import Link from 'next/link';

import SubpageHero from '@/components/SubpageHero';

const STATS = [
  {
    icon: '/assets/images/icon1_3.png',
    value: '10',
    suffix: 'K+',
    label: 'Satisfied Diners',
  },
  {
    icon: '/assets/images/icon2_3.png',
    value: '8',
    suffix: 'K+',
    label: 'Dishes Delivered',
  },
  {
    icon: '/assets/images/icon3_3.png',
    value: '314',
    suffix: '',
    label: 'Dishes On The Menu',
  },
  {
    icon: '/assets/images/icon4_3.png',
    value: '200',
    suffix: '+',
    label: 'Trained Chefs & Servers',
  },
];

const TIMELINE = [
  {
    year: 'THE BEGINNING',
    title: 'One Kitchen, One Promise',
    text: 'PM Zaika opened on Shersha Road with a single clay oven and a hand-written dum biryani recipe.',
  },
  {
    year: 'THE CRAFT',
    title: 'Charcoal Moved In',
    text: 'We brought in the clay tandoor and the hand-pounded kadais that give our kebabs their smoke.',
  },
  {
    year: 'THE GROWTH',
    title: 'Patna Started Ordering',
    text: 'Delivery, takeaways and a dining hall that kept getting busier — most of it by word of mouth.',
  },
  {
    year: 'TODAY',
    title: '314 Dishes, One Kitchen',
    text: 'From royal biryanis to a 45-dish buffet, everything is still cooked fresh to order.',
  },
];

const TESTIMONIALS = [
  {
    avatar: '/assets/images/WhatsApp-Image-2026-02-03-at-2.39.04-PM.jpeg',
    name: 'Amit Kumar',
    location: 'Gur Ki Mandi, Patna',
    quote:
      'The dum biryani arrived still piping hot and the meat fell apart at a touch. We have not ordered anywhere else since.',
  },
  {
    avatar: '/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM.jpeg',
    name: 'Rahul Sharma',
    location: 'Shershah Road, Patna',
    quote:
      'Ordered a table for eight on a Saturday night without any fuss. The paneer butter masala is genuinely worth the hype.',
  },
  {
    avatar: '/assets/images/WhatsApp-Image-2026-02-03-at-2.39.04-PM-1.jpeg',
    name: 'Priya Singh',
    location: 'Patna City',
    quote:
      'I was sceptical about ordering biryani over delivery, but the packaging held up perfectly and every spice was intact.',
  },
  {
    avatar: '/assets/images/WhatsApp-Image-2026-02-03-at-2.39.05-PM-1.jpeg',
    name: 'Vikram Malhotra',
    location: 'Kankarbagh, Patna',
    quote:
      'The tandoori chicken is charred exactly right — smoky outside, tender inside. This is proper Mughlai cooking.',
  },
];

export default function AboutPage() {
  return (
    <>
      <SubpageHero
        eyebrow="About PM Zaika"
        title="Taste bhi best hi,"
        accent="quality bhi."
        description="A Patna kitchen built on dum-cooked biryanis, charcoal tandoori and slow-simmered gravies — served with the warmth of a family-run restaurant."
        crumb="About Us"
      />

      {/* =========================================================================
           OUR STORY
           ========================================================================= */}
      <section className="subpage-section">
        <div className="container">
          <div className="split-layout">
            <div className="framed-visual">
              <img
                src="/assets/images/food_royal_thali.jpg"
                alt="A full PM Zaika royal thali"
                loading="lazy"
              />
            </div>

            <div>
              <span className="subpage-tag">Our Story</span>
              <h2 className="subpage-heading">
                A Patna kitchen, not a chain.
              </h2>
              <p className="subpage-lede">
                PM Zaika began with a simple conviction: that the food people remember
                is the food cooked slowly, with real ingredients and no shortcuts. We
                still cook that way — aged basmati layered by hand into sealed handi,
                kebabs marinated overnight, gravies simmered until the masala gives in.
              </p>
              <p className="subpage-lede">
                Today our menu spans more than three hundred dishes, from the royal
                dum biryanis the kitchen is known for to a forty-five item weekend
                buffet. The recipe count grew, but the method never changed.
              </p>

              <ul className="check-list">
                <li>Hand-picked spices, ground in-house</li>
                <li>Marination done a full day before cooking</li>
                <li>Sealed packaging on every delivery order</li>
              </ul>

              <Link href="/reservation" className="btn-see-more">
                <span>Reserve a table</span>
                <span className="arrow-circle">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
           STAT BAND
           ========================================================================= */}
      <section className="stat-band">
        <div className="container">
          <div className="stat-band-grid">
            {STATS.map((stat) => (
              <div className="stat-band-item" key={stat.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stat.icon} alt="" className="stat-band-icon" loading="lazy" />
                <div className="stat-band-number">
                  {stat.value}
                  {stat.suffix && <em>{stat.suffix}</em>}
                </div>
                <div className="stat-band-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
           MILESTONES TIMELINE
           ========================================================================= */}
      <section className="subpage-section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">How We Got Here</div>
            <h2 className="section-title">From one oven to a full kitchen.</h2>
            <p className="section-subtitle">
              The recipe count changed a hundred times. The way we cook barely did.
            </p>
          </div>

          <div className="story-timeline">
            {TIMELINE.map((milestone) => (
              <div className="story-step" key={milestone.title}>
                <span className="story-step-dot" />
                <div className="story-step-year">{milestone.year}</div>
                <h3 className="story-step-title">{milestone.title}</h3>
                <p className="story-step-text">{milestone.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
           TESTIMONIALS (reuses the home page card exactly)
           ========================================================================= */}
      <section className="subpage-section subpage-section--warm">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">Guest Experiences</div>
            <h2 className="section-title">What Customers Say About Us.</h2>
            <p className="section-subtitle">
              Real feedback from diners across Patna City.
            </p>
          </div>

          <div className="testimonials-luxury-grid">
            {TESTIMONIALS.map((review) => (
              <div className="testimonial-luxury-card" key={review.name}>
                <div className="quote-top-row">
                  <span className="stars-gold">★★★★★</span>
                  <span className="quote-mark">&ldquo;</span>
                </div>
                <p className="testimonial-quote-body">{review.quote}</p>
                <div className="reviewer-profile-bar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="reviewer-avatar"
                    loading="lazy"
                  />
                  <div>
                    <div className="reviewer-name">{review.name}</div>
                    <div className="reviewer-badge-verified">
                      Verified Diner · {review.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
           CLOSING CTA
           ========================================================================= */}
      <section className="subpage-section subpage-section--tight">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-header-center" style={{ marginBottom: '30px' }}>
            <div className="section-eyebrow">Come Hungry</div>
            <h2 className="section-title">The kitchen is warm.</h2>
            <p className="section-subtitle">
              Walk in for a table, or order online and pay by UPI — your biryani is
              cooked after you order, never before.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/#menu-showcase" className="btn-hero-primary">
              <span>Order Online</span>
              <span className="btn-icon-circle">→</span>
            </Link>
            <Link href="/gallery" className="btn-see-more">
              <span>See the Gallery</span>
              <span className="arrow-circle">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}