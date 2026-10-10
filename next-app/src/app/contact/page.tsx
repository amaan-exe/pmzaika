'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import SubpageHero from '@/components/SubpageHero';
import { api } from '@/lib/client/api';

interface StorefrontSettings {
  restaurantName: string;
  restaurantAddress: string;
  supportPhone: string;
  openingTime: string;
  closingTime: string;
  isStoreOpen: boolean;
}

const EMAIL = 'zaikarestaurant81@gmail.com';
const WHATSAPP = '917488260572';
const DISPLAY_PHONE = '+91 74882 60572';

const MAP_QUERY =
  'PM Zaika Restaurant, Shersha Road, Gur Ki Mandi, Patna City, Bihar 800007';

export default function ContactPage() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);

  // Hours, phone and open/closed state are admin-editable, so they come from the
  // backend rather than being hard-coded in the markup.
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

  const isOpen = settings?.isStoreOpen ?? true;

  const contactCards = [
    {
      label: 'Visit Us',
      icon: (
        <>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </>
      ),
      value: (
        <>
          {settings?.restaurantAddress ??
            'Shersha Road, Gur Ki Mandi, opposite Bank of India, Patna 800007, Bihar'}
        </>
      ),
      meta: 'Gur Ki Mandi, Patna City',
    },
    {
      label: 'Call or WhatsApp',
      icon: (
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
      ),
      value: (
        <a href={`tel:${DISPLAY_PHONE.replace(/\s/g, '')}`}>{DISPLAY_PHONE}</a>
      ),
      meta: 'Fastest way to reserve a table',
    },
    {
      label: 'Email',
      icon: (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </>
      ),
      value: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>,
      meta: 'Bulk & corporate orders',
    },
    {
      label: 'Opening Hours',
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ),
      value: (
        <>
          {settings?.openingTime ?? '11:00 AM'} – {settings?.closingTime ?? '11:30 PM'}
        </>
      ),
      meta: 'Open daily, all week',
    },
  ];

  return (
    <>
      <SubpageHero
        eyebrow="Get In Touch"
        title="Come find us"
        accent="in Gur Ki Mandi."
        description="Questions about a booking, a bulk order or the menu? Call us, message us on WhatsApp, or simply walk in — the kitchen rarely sits idle."
        crumb="Contact"
      />

      {/* =========================================================================
           CONTACT CARDS
           ========================================================================= */}
      <section className="subpage-section">
        <div className="container">
          <div className="section-header-center" style={{ marginBottom: '38px' }}>
            <div className="section-eyebrow">Reach Out</div>
            <h2 className="section-title">We are easy to find.</h2>
            <p className="section-subtitle">
              {settings?.restaurantName ?? 'PM Zaika Restaurant'} — Shersha Road, Patna City.
              Open every day from {settings?.openingTime ?? '11:00 AM'} to{' '}
              {settings?.closingTime ?? '11:30 PM'}.
            </p>

            <div style={{ marginTop: '20px' }}>
              <span
                className={`open-status-pill ${isOpen ? '' : 'open-status-pill--closed'}`}
              >
                <span className="open-status-dot" />
                {isOpen ? 'Accepting orders right now' : 'Currently closed'}
              </span>
            </div>
          </div>

          <div className="contact-cards">
            {contactCards.map((card) => (
              <div className="contact-card" key={card.label}>
                <div className="contact-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {card.icon}
                  </svg>
                </div>
                <div className="contact-card-label">{card.label}</div>
                <div className="contact-card-value">{card.value}</div>
                <div className="contact-card-meta">{card.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
           MAP + EXTERIOR
           ========================================================================= */}
      <section className="subpage-section subpage-section--warm subpage-section--tight">
        <div className="container">
          <div className="section-header-center" style={{ marginBottom: '32px' }}>
            <div className="section-eyebrow">Find The Restaurant</div>
            <h2 className="section-title">Right on Shersha Road.</h2>
          </div>

          <div className="contact-map">
            <iframe
              title="PM Zaika Restaurant location map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                MAP_QUERY
              )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              marginTop: '28px',
            }}
          >
            <a
              className="btn-see-more"
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              style={{ justifyContent: 'center' }}
            >
              <span>Message on WhatsApp</span>
              <span className="arrow-circle">→</span>
            </a>
            <a
              className="btn-see-more"
              href={`tel:${DISPLAY_PHONE.replace(/\s/g, '')}`}
              style={{ justifyContent: 'center' }}
            >
              <span>Call the restaurant</span>
              <span className="arrow-circle">→</span>
            </a>
            <Link href="/reservation" className="btn-see-more" style={{ justifyContent: 'center' }}>
              <span>Reserve a table</span>
              <span className="arrow-circle">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
           EXTERIOR PHOTO
           ========================================================================= */}
      <section className="subpage-section subpage-section--tight">
        <div className="container">
          <div className="framed-visual" style={{ maxWidth: '940px', margin: '0 auto' }}>
            <img
              src="/assets/images/zk-768x442.jpeg"
              alt="PM Zaika Restaurant exterior at night"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}