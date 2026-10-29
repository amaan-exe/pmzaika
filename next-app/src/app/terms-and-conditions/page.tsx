import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/SubpageHero';

export const metadata: Metadata = {
  title: 'Terms & Services | PM Zaika Restaurant Patna',
  description:
    'Terms of service, dining conditions, online ordering rules, and legal agreements governing PM Zaika Restaurant in Patna, Bihar.',
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Legal & Operations"
        title="Terms &"
        accent="Services Agreement"
        description="Official conditions governing online food orders, dining table reservations, delivery logistics, and guest services at PM Zaika."
        crumb="Terms & Services"
      />

      <section className="policy-page-section">
        <div className="container policy-container">
          <article className="policy-card">
            <div className="policy-meta-bar">
              <span className="policy-badge">User Agreement</span>
              <span className="policy-date">Effective: 2026 • Patna, Bihar</span>
            </div>

            <div className="policy-callout policy-callout--amber">
              <span className="policy-callout-icon">📜</span>
              <div className="policy-callout-content">
                <h2 className="policy-callout-title">Binding Service Agreement</h2>
                <p className="policy-callout-text">
                  By accessing the PM Zaika platform, reserving a table, or placing an order for
                  pickup or delivery, you agree to comply with these terms, our{' '}
                  <Link href="/privacy-policy" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                    Privacy Policy
                  </Link>
                  , and our{' '}
                  <Link href="/refund-policy" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                    Cancellation & Refund Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">01</span>
                Culinary Ordering & Order Acceptance
              </h2>
              <p className="policy-text">
                All food orders placed through our digital ordering desk are subject to ingredient
                availability, active kitchen capacity, and acceptance by our floor management. We
                reserve the right to refuse or limit orders in the event of unexpected kitchen load,
                severe weather, or operational constraints in Patna.
              </p>
              <p className="policy-text">
                A legally binding culinary fulfillment contract is established only when our kitchen
                acknowledges the order into active preparation.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">02</span>
                Pricing, Menu Items & UPI Payments
              </h2>
              <p className="policy-text">
                Prices for all biryanis, tandoori specialties, and curries are listed in Indian
                Rupees (₹). We reserve the right to revise menu pricing, promotional discount codes,
                or portion sizes without prior notice.
              </p>
              <ul className="policy-list">
                <li>
                  <strong>Digital Payments:</strong> Payments submitted via UPI require a valid
                  12-digit transaction reference (UTR) matching our banking records.
                </li>
                <li>
                  <strong>Verification:</strong> If a payment reference is found to be duplicate,
                  invalid, or unverifiable on our bank statement, the order will be placed on hold or
                  cancelled immediately.
                </li>
                <li>
                  <strong>Cash on Delivery (COD):</strong> Where available, exact cash must be
                  tendered to the authorized rider upon delivery handoff.
                </li>
              </ul>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">03</span>
                Cancellations & Strict Refund Limitations
              </h2>
              <p className="policy-text">
                Because our culinary items are perishable and custom cooked to order:
              </p>
              <div className="policy-callout policy-callout--danger" style={{ margin: '14px 0' }}>
                <span className="policy-callout-icon">⚠️</span>
                <div className="policy-callout-content">
                  <p className="policy-callout-text">
                    <strong>
                      Once an order enters the kitchen preparation stage or is marked out for
                      delivery, NO CANCELLATION, REFUND, OR PAYMENT REVERSAL IS PERMITTED.
                    </strong>{' '}
                    Any inquiry must be made strictly on phone to{' '}
                    <a href="tel:+917488260572" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                      +91 7488 260 572
                    </a>{' '}
                    before kitchen ignition, subject to discretionary management review.
                  </p>
                </div>
              </div>
              <p className="policy-text">
                Please refer to our full{' '}
                <Link href="/refund-policy" style={{ color: 'var(--primary-orange)', fontWeight: 600 }}>
                  Refund & Cancellation Policy
                </Link>{' '}
                for comprehensive telephonic deliberation procedures.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">04</span>
                Dine-In Table Reservations
              </h2>
              <p className="policy-text">
                Table bookings made through our platform are held for a maximum grace period of{' '}
                <strong>15 minutes</strong> past the scheduled booking time before the table may be
                released to waiting walk-in guests during peak dining rush.
              </p>
              <p className="policy-text">
                Special banquet arrangements or private room bookings require direct telephone
                confirmation with the general manager.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">05</span>
                Intellectual Property & Brand Rights
              </h2>
              <p className="policy-text">
                All branding, restaurant logos, food photography, menu descriptions, and website
                source designs are the proprietary intellectual property of PM Zaika Restaurant and
                its design partners. Unauthorized reproduction or scraping is strictly prohibited.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">06</span>
                Governing Law & Dispute Jurisdiction
              </h2>
              <p className="policy-text">
                These terms shall be governed by and construed in accordance with the laws of the
                Republic of India. Any disputes arising out of or related to our food services,
                website operations, or delivery transactions shall fall within the exclusive
                jurisdiction of the competent courts of <strong>Patna, Bihar, India</strong>.
              </p>
            </div>

            <div className="policy-contact-box">
              <h3 className="policy-contact-title">Official Inquiries & Support Desk</h3>
              <p className="policy-contact-desc">
                For official legal notices, business partnerships, or customer relations:
              </p>
              <div className="policy-contact-links">
                <a href="mailto:zaikarestaurant81@gmail.com" className="policy-contact-link">
                  <span>✉️ zaikarestaurant81@gmail.com</span>
                </a>
                <a href="tel:+917488260572" className="policy-contact-link">
                  <span>📞 +91 7488 260 572</span>
                </a>
                <span className="policy-contact-link" style={{ color: 'var(--text-muted)' }}>
                  📍 PM Zaika Restaurant, Shersha Road, Gur Ki Mandi, Patna-800007, Bihar
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
