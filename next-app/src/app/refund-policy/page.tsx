import React from 'react';
import type { Metadata } from 'next';
import SubpageHero from '@/components/SubpageHero';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | PM Zaika Restaurant Patna',
  description:
    'Read PM Zaika Restaurant’s cancellation and refund guidelines. All refund deliberations are handled exclusively via phone consultation before food preparation begins.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Customer Information"
        title="Cancellation &"
        accent="Refund Policy"
        description="Transparent guidelines regarding culinary order changes, telephonic review procedures, and our made-to-order preparation standards."
        crumb="Refund Policy"
      />

      <section className="policy-page-section">
        <div className="container policy-container">
          <article className="policy-card">
            <div className="policy-meta-bar">
              <span className="policy-badge">Official Restaurant Policy</span>
              <span className="policy-date">Effective: 2026 • Patna, Bihar</span>
            </div>

            {/* Crucial Notice Callout Box */}
            <div className="policy-callout policy-callout--danger">
              <span className="policy-callout-icon">⚠️</span>
              <div className="policy-callout-content">
                <h2 className="policy-callout-title">Critical Order Fulfillment Notice</h2>
                <p className="policy-callout-text">
                  Because our food is freshly cooked to order using perishable ingredients,{' '}
                  <strong>
                    once an order has been accepted by the kitchen desk, inducted into preparation,
                    or marked as out for delivery, NO CANCELLATIONS, REFUNDS, OR PAYMENT REVERSALS
                    can be granted under any circumstances.
                  </strong>
                </p>
                <a href="tel:+917488260572" className="policy-phone-btn">
                  <span>📞 Call Kitchen Desk: +91 7488 260 572</span>
                </a>
              </div>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">01</span>
                Perishable Culinary Preparation Standards
              </h2>
              <p className="policy-text">
                At PM Zaika Restaurant, every dish—from our slow dum-cooked biryanis and clay-oven
                kebabs to hand-crafted curries—is freshly made upon individual order receipt. Unlike
                packaged retail merchandise, prepared culinary dishes cannot be restocked, returned,
                or repurposed.
              </p>
              <p className="policy-text">
                Consequently, our cancellation and refund protocols are designed to reflect the
                perishable, time-sensitive nature of authentic artisanal food service.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">02</span>
                Telephonic Deliberation Procedure
              </h2>
              <p className="policy-text">
                Any potential cancellation request, order adjustment, or refund consideration must
                be initiated <strong>strictly and exclusively via direct phone communication</strong>{' '}
                with the restaurant manager on duty at{' '}
                <a href="tel:+917488260572" style={{ color: 'var(--primary-orange)', fontWeight: 700 }}>
                  +91 7488 260 572
                </a>
                .
              </p>
              <p className="policy-text">
                Due to the dynamic flow of kitchen stove lines, digital messages, automated notes,
                or post-order WhatsApp communications do not constitute verified cancellation. Any
                reconciliation, goodwill credit, or adjustment remains at the discretion of the
                duty manager on call, determined strictly by the state of kitchen preparation at the
                exact moment of telephonic verification.
              </p>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">03</span>
                Pre-Preparation Order Adjustments
              </h2>
              <p className="policy-text">
                In the rare instance that a customer needs to cancel or adjust an order immediately
                after submission, the customer must place a voice call to the kitchen desk within
                the immediate window prior to stove ignition (typically within 60 to 120 seconds of
                checkout).
              </p>
              <ul className="policy-list">
                <li>
                  <strong>If the kitchen has NOT commenced cooking:</strong> The management may, at
                  its operational discretion, approve order modification or cancellation.
                </li>
                <li>
                  <strong>If the kitchen has already commenced preparation:</strong> Ingredients have
                  already been dedicated and culinary processing initiated; the order cannot be
                  cancelled, halted, or refunded.
                </li>
                <li>
                  <strong>If the order is marked Out for Delivery:</strong> The delivery personnel
                  have departed with the packaged food; no cancellation or reversal is permitted.
                </li>
              </ul>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">04</span>
                Discrepancies, Packaging, & Quality Review
              </h2>
              <p className="policy-text">
                We take extreme pride in kitchen quality and tamper-evident thermal food packaging.
                If you believe an incorrect item was delivered or physical packaging was
                compromised during transit:
              </p>
              <ol className="policy-list">
                <li>
                  You must place a voice call to our restaurant helpline at <strong>+91 7488 260 572</strong>{' '}
                  within <strong>15 minutes</strong> of taking delivery.
                </li>
                <li>
                  Provide your 6-character Order ID (e.g. <code>#ZAIKA-...</code>) and photographic
                  or video proof of the unopened package or discrepancy via WhatsApp to the verified
                  kitchen number.
                </li>
                <li>
                  The managerial desk will inspect the report against our kitchen assembly logs. Any
                  corrective action, such as dispatching a fresh replacement dish or issuing store
                  credit, is evaluated on a case-by-case basis.
                </li>
              </ol>
            </div>

            <div className="policy-section-block">
              <h2 className="policy-section-title">
                <span className="policy-section-num">05</span>
                Approved Refund Processing & Timelines
              </h2>
              <p className="policy-text">
                Where an exceptional refund or payment reversal is sanctioned by the management
                following phone deliberation, the funds will be remitted back to the customer’s
                original UPI ID or bank account.
              </p>
              <p className="policy-text">
                Depending on UPI bank network clearance (NPCI) and banking partner settlement
                cycles, processed refunds typically reflect within <strong>3 to 7 business working days</strong>.
              </p>
            </div>

            <div className="policy-contact-box">
              <h3 className="policy-contact-title">Direct Kitchen Consultation Desk</h3>
              <p className="policy-contact-desc">
                For immediate assistance regarding any live order, please reach our floor manager
                directly:
              </p>
              <div className="policy-contact-links">
                <a href="tel:+917488260572" className="policy-contact-link">
                  <span>📞 +91 7488 260 572 (Direct Floor Call)</span>
                </a>
                <a href="mailto:zaikarestaurant81@gmail.com" className="policy-contact-link">
                  <span>✉️ zaikarestaurant81@gmail.com</span>
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
