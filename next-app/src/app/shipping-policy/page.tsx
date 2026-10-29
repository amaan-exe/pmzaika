import React from 'react';
import type { Metadata } from 'next';
import SubpageHero from '@/components/SubpageHero';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | PM Zaika Restaurant Patna',
  description:
    'Learn about PM Zaika Restaurant’s doorstep delivery zones in Patna, estimated transit times, thermal packaging standards, and live order tracking.',
};

export default function ShippingPolicyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Delivery & Logistics"
        title="Shipping &"
        accent="Delivery Policy"
        description="Fresh culinary preparation, specialized thermal packaging, and fast doorstep delivery across Patna, Bihar."
        crumb="Shipping Policy"
      />

      <section className="policy-page-section">
        <div className="container policy-container">
          <article className="policy-card">
            <div className="policy-meta-bar">
              <span className="policy-badge">Delivery Guidelines</span>
              <span className="policy-date">Updated: 2026 • Patna, Bihar</span>
            </div>

            <div className="policy-callout policy-callout--amber">
              <span className="policy-callout-icon">🛵</span>
              <div className="policy-callout-content">
                <h2 className="policy-callout-title">Fast Doorstep Delivery in Patna</h2>
                <p className="policy-callout-text">
                  Orders are cooked fresh and dispatched in insulated thermal containers to preserve
                  steaming aroma, crust crispness, and temperature. Standard transit window is
                  typically <strong>30 to 50 minutes</strong> from kitchen confirmation.
                </p>
              </div>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">01</span>
                Serviceable Delivery Zones
              </h2>
              <p className="policy-text">
                PM Zaika Restaurant operates our delivery kitchen from Shersha Road, Gur Ki Mandi,
                Patna. Our direct fleet services key residential and commercial areas across Patna,
                including:
              </p>
              <ul className="policy-list">
                <li>Gur Ki Mandi & Shershah Road (Immediate 20–30 min delivery)</li>
                <li>Patna City / Gulzarbagh / Meena Bazar</li>
                <li>Kumhrar, Kankarbagh & Rajendra Nagar</li>
                <li>Zero Mile, Transport Nagar & Agamkuan corridors</li>
                <li>Surrounding zones within our active operational radius</li>
              </ul>
              <p className="policy-text">
                If your location falls slightly outside our standard radius, our team may verify
                route viability on a case-by-case basis via telephone.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">02</span>
                Kitchen Operating Hours & Delivery Timings
              </h2>
            <p className="policy-text">
              Our kitchen delivers 7 days a week during the following operating window:
            </p>
            <ul className="policy-list">
              <li>
                <strong>Monday to Sunday:</strong> 11:00 AM – 10:00 PM (Last online order received
                at 9:45 PM).
              </li>
              <li>
                Orders placed during heavy rush hours (e.g. 1:00 PM – 2:30 PM lunch or 8:00 PM –
                9:30 PM dinner) may experience a nominal 10–15 minute buffer due to high kadai
                utilization and street traffic.
              </li>
            </ul>
          </div>

          <div className="policy-section-block">
            <h2 className="policy-section-title">
              <span className="policy-section-num">03</span>
              Delivery Charges & Thresholds
            </h2>
            <p className="policy-text">
              Delivery fees are calculated transparently during online checkout based on delivery
              distance from our Shersha Road kitchen:
            </p>
            <ul className="policy-list">
              <li>
                <strong>Local Vicinity:</strong> Nominal flat rate or complimentary delivery on
                eligible qualifying order amounts.
              </li>
              <li>
                <strong>Extended Patna Zones:</strong> Calculated dynamically by distance to support
                our dedicated rider fleet.
              </li>
              <li>
                Special festival promotional coupons (e.g. <code>ZAIKA50</code>) may waive or
                discount delivery fees as specified during checkout.
              </li>
            </ul>
          </div>

          <div className="policy-section-block">
            <h2 className="policy-section-title">
              <span className="policy-section-num">04</span>
              Thermal Packaging & Food Safety
            </h2>
            <p className="policy-text">
              Every dish is packaged using high-grade, food-safe, leak-resistant containers with
              tamper-evident seals. Biryanis and gravies are sealed while boiling hot to lock in
              the authentic dum aroma until you open them at your dining table.
            </p>
            <p className="policy-text">
              Customers are advised to examine the exterior seal upon receiving the delivery bag.
              If a seal appears broken, notify our helpline immediately.
            </p>
          </div>

          <div className="policy-section-block">
            <h2 className="policy-section-title">
              <span className="policy-section-num">05</span>
              Address Accuracy & Customer Availability
            </h2>
            <p className="policy-text">
              To ensure swift handoff, please ensure accurate landmark details and an active,
              reachable phone number during checkout. Our delivery rider will place a call upon
              arrival at your building or gate.
            </p>
            <p className="policy-text">
              If a customer is unreachable by phone for more than 15 minutes after the rider
              arrives at the destination, the order may be marked failed due to customer
              unavailability. In such circumstances, as food cannot be resold, the order remains
              non-refundable.
            </p>
          </div>

          <div className="policy-contact-box">
            <h3 className="policy-contact-title">Delivery Assistance & Rider Coordination</h3>
            <p className="policy-contact-desc">
              Need urgent updates on an active delivery order? Contact our dispatch coordinator:
            </p>
            <div className="policy-contact-links">
              <a href="tel:+917488260572" className="policy-contact-link">
                <span>📞 +91 7488 260 572 (Kitchen Dispatch)</span>
              </a>
              <a href="mailto:zaikarestaurant81@gmail.com" className="policy-contact-link">
                <span>✉️ zaikarestaurant81@gmail.com</span>
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  </>
);
}
