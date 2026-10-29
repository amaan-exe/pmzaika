import React from 'react';
import type { Metadata } from 'next';
import SubpageHero from '@/components/SubpageHero';

export const metadata: Metadata = {
  title: 'Privacy Policy | PM Zaika Restaurant Patna',
  description:
    'Read how PM Zaika Restaurant protects and manages your personal data, contact information, delivery addresses, and payment privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Data Protection"
        title="Privacy &"
        accent="Data Protection"
        description="Our commitment to safeguarding your personal contact information, delivery location data, and online payment confidentiality."
        crumb="Privacy Policy"
      />

      <section className="policy-page-section">
        <div className="container policy-container">
          <article className="policy-card">
            <div className="policy-meta-bar">
              <span className="policy-badge">Customer Privacy Standard</span>
              <span className="policy-date">Updated: 2026 • Patna, Bihar</span>
            </div>

            <div className="policy-callout policy-callout--amber">
              <span className="policy-callout-icon">🔒</span>
              <div className="policy-callout-content">
                <h2 className="policy-callout-title">Your Privacy Matters to Us</h2>
                <p className="policy-callout-text">
                  PM Zaika Restaurant respects your privacy. We collect only the essential details
                  required to cook your dishes, coordinate timely doorstep delivery, and provide
                  real-time WhatsApp order tracking updates. We never sell or lease customer data.
                </p>
              </div>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">01</span>
                Information We Collect
              </h2>
              <p className="policy-text">
                When you interact with our website, place a dining reservation, or submit an online
                food delivery order, we collect:
              </p>
              <ul className="policy-list">
                <li>
                  <strong>Contact Information:</strong> Full Name, Mobile Phone Number, and Email
                  Address (if voluntarily provided).
                </li>
                <li>
                  <strong>Delivery Details:</strong> Street Address, Flat/House Number, Landmark,
                  and Area Pin Code within Patna.
                </li>
                <li>
                  <strong>Order Information:</strong> Dishes selected, quantities, chef instructions
                  (e.g. spice level, no onions), and order history.
                </li>
                <li>
                  <strong>Payment Verification:</strong> UPI Transaction Reference (UTR number) or
                  payment proof screenshot submitted for verification. We do NOT store card CVVs,
                  passwords, or banking PINs.
                </li>
              </ul>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">02</span>
                How We Use Your Information
              </h2>
              <p className="policy-text">
                The information gathered is strictly utilized for culinary fulfillment and customer
                care:
              </p>
              <ul className="policy-list">
                <li>Accepting, preparing, and packaging your food orders with customized dietary preferences.</li>
                <li>Guiding our delivery riders directly to your doorstep in Patna.</li>
                <li>
                  Transmitting real-time order status notifications (e.g. Preparing, Out for
                  Delivery) via WhatsApp and browser notifications.
                </li>
                <li>Addressing customer support inquiries, feedback, or table booking requests.</li>
                <li>Preventing fraudulent UPI payment submissions and safeguarding restaurant operations.</li>
              </ul>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">03</span>
                Payment Data & Banking Security
              </h2>
              <p className="policy-text">
                All digital transactions on PM Zaika are processed via official UPI payment rails
                (BHIM, Google Pay, PhonePe, Paytm). Payment verification is done against authorized
                merchant banking records.
              </p>
              <p className="policy-text">
                <strong>Important Security Notice:</strong> PM Zaika personnel will never contact you
                asking for your UPI PIN, ATM PIN, OTP, or internet banking password. Please never
                disclose banking credentials to anyone.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">04</span>
                Third-Party Disclosures & Integrations
              </h2>
              <p className="policy-text">
                We share data only with trusted infrastructure partners necessary to execute our
                services:
              </p>
              <ul className="policy-list">
                <li>
                  <strong>Delivery Riders:</strong> Your contact name, phone number, and delivery
                  address are shared with our active rider for handoff purposes.
                </li>
                <li>
                  <strong>Communication Providers:</strong> WhatsApp Business API and Telegram
                  kitchen notification bots for automated receipts and kitchen alerts.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> Disclosures made when mandatory to comply
                  with Indian law or judicial directives.
                </li>
              </ul>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">05</span>
                Your Rights & Data Inquiries
              </h2>
              <p className="policy-text">
                You have the right to request access to your stored customer profile or request the
                erasure of your delivery records from our database. To make a data request, please
                email our administrator at{' '}
                <a href="mailto:zaikarestaurant81@gmail.com" style={{ color: 'var(--primary-orange)' }}>
                  zaikarestaurant81@gmail.com
                </a>
                .
              </p>
            </div>

            <div className="policy-contact-box">
              <h3 className="policy-contact-title">Privacy Officer Contact</h3>
              <p className="policy-contact-desc">
                For any queries regarding this policy or data safety at PM Zaika:
              </p>
              <div className="policy-contact-links">
                <a href="mailto:zaikarestaurant81@gmail.com" className="policy-contact-link">
                  <span>✉️ zaikarestaurant81@gmail.com</span>
                </a>
                <a href="tel:+917488260572" className="policy-contact-link">
                  <span>📞 +91 7488 260 572</span>
                </a>
                <span className="policy-contact-link" style={{ color: 'var(--text-muted)' }}>
                  📍 Shersha Road, Gur Ki Mandi, Patna-800007, Bihar
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
