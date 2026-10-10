'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import SubpageHero from '@/components/SubpageHero';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/client/api';

interface ReservationForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  seating: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof ReservationForm, string>>;

const EMPTY_FORM: ReservationForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  date: '',
  time: '',
  guests: '2',
  seating: '',
  notes: '',
};

const TIME_SLOTS = [
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
];

const SEATING_OPTIONS = [
  'Main Dining Hall',
  'Family Lounge',
  'Window Side Seating',
  'Birthday / Private Lounge',
];

const ASSURANCES = [
  {
    title: 'Instant Table Confirmation',
    text: 'Your booking request lands with our front desk immediately, and we confirm the exact table within minutes.',
    icon: (
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    ),
  },
  {
    title: 'Groups of 20+ Welcome',
    text: 'Weddings, birthdays and corporate lunches — reserve the private lounge or ask us about a bespoke set menu.',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: 'Hygiene Sealed Kitchen',
    text: 'Every kitchen surface is sanitised daily and all dum-cooked dishes are sealed before reaching your table.',
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: 'Freshly Cooked To Order',
    text: 'Nothing sits under a lamp. Your biryanis and kebabs hit the fire only after your table is confirmed.',
    icon: (
      <>
        <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
        <path d="M9 21h6" />
      </>
    ),
  },
];

export default function ReservationPage() {
  const { showToast } = useCart();

  const [form, setForm] = useState<ReservationForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Booking is for today onwards only.
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const update = (field: keyof ReservationForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (form.firstName.trim().length < 2) next.firstName = 'Please enter your first name';
    if (form.lastName.trim().length < 2) next.lastName = 'Please enter your last name';

    const digits = form.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) next.phone = 'Enter a valid 10-digit mobile number';

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid e-mail address';
    if (!form.date) next.date = 'Choose a date';
    else if (form.date < today) next.date = 'Pick today or a later date';
    if (!form.time) next.time = 'Choose a time slot';

    const guests = Number(form.guests);
    if (!Number.isFinite(guests) || guests < 1) next.guests = 'Enter the number of guests';
    else if (guests > 20) next.guests = 'For more than 20 guests, please call us';

    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
    const message = [
      `🍽️ *TABLE RESERVATION - PM ZAIKA RESTAURANT*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Name:* ${fullName}`,
      `📞 *Phone:* +91${form.phone.replace(/\D/g, '').slice(-10)}`,
      `✉️ *Email:* ${form.email.trim()}`,
      `📅 *Date:* ${form.date}`,
      `🕐 *Time:* ${form.time}`,
      `👨‍👩‍👧‍👦 *Guests:* ${form.guests}`,
      `🪑 *Seating:* ${form.seating || 'No preference'}`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      form.notes.trim() ? `📝 *Notes:* ${form.notes.trim()}` : '',
      `━━━━━━━━━━━━━━━━━━━━━`,
      `Please confirm my table. Thank you!`,
    ]
      .filter(Boolean)
      .join('\n');

    showToast(`Reservation requested for ${fullName}! Opening WhatsApp… ✨`);
    setSubmitted(true);
    window.open(
      `https://wa.me/917488260572?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  if (submitted) {
    return (
      <>
        <SubpageHero
          eyebrow="Reservation Requested"
          title="Your table is"
          accent="almost reserved."
          description="We have opened WhatsApp with your booking details. Our front desk confirms the exact table within a few minutes."
          crumb="Reservation"
        />

        <section className="subpage-section">
          <div className="container" style={{ maxWidth: '640px' }}>
            <div className="booking-card">
              <div className="booking-success">
                <div className="booking-success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="booking-success-title">Almost there!</h2>
                <p className="booking-success-text">
                  We have prepared your request for{' '}
                  <strong>{form.guests}</strong> guest{Number(form.guests) === 1 ? '' : 's'} on{' '}
                  <strong>{form.date}</strong> at <strong>{form.time}</strong>.
                  <br />
                  Send the message that just opened in WhatsApp to lock it in.
                </p>
                <button
                  type="button"
                  className="btn-submit-res"
                  onClick={() => setSubmitted(false)}
                >
                  Edit booking details
                </button>
                <div style={{ marginTop: '18px' }}>
                  <Link href="/#menu-showcase" className="step-link">
                    <span>Browse the menu while you wait</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SubpageHero
        eyebrow="Reserve Your Table"
        title="A royal seat,"
        accent="waiting for you."
        description="Book a table for family dinners, birthdays and celebrations. Tell us when and how many, and our front desk takes care of the rest."
        crumb="Reservation"
      />

      {/* =========================================================================
           BOOKING FORM + REASSURANCES
           ========================================================================= */}
      <section className="subpage-section">
        <div className="container">
          <div className="split-layout--sidebar">
            {/* Left: Why reserve with us */}
            <div className="res-intro-aside">
              <div>
                <span className="subpage-tag">Why Reserve</span>
                <h2 className="subpage-heading">Skip the queue.</h2>
                <p className="subpage-lede">
                  Peak evenings fill up fast in Patna City. Reserving ahead means your
                  table is laid and your first round starts the moment you sit down.
                </p>

                <ul className="check-list">
                  <li>Tables held for 15 minutes past your slot</li>
                  <li>Dum biryanis and kebabs cooked to your order</li>
                  <li>Birthday cake and décor on request</li>
                  <li>Walk-ins welcome whenever a table is free</li>
                </ul>

                <Link href="/contact" className="btn-see-more">
                  <span>Questions? Contact us</span>
                  <span className="arrow-circle">→</span>
                </Link>
              </div>

              <div className="res-intro-aside">
                {ASSURANCES.map((item) => (
                  <div className="assurance-card" key={item.title}>
                    <div className="assurance-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <h3 className="assurance-title">{item.title}</h3>
                      <p className="assurance-text">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: The booking card */}
            <div className="booking-card">
              <div className="booking-card-head">
                <h2 className="booking-card-title">Reservation Form</h2>
                <p className="booking-card-note">
                  Fields marked with <span className="req-star">*</span> are required
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid-2">
                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfFirstName">
                      First Name<span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="rfFirstName"
                      className="form-input-res"
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={(e) => update('firstName')(e.target.value)}
                    />
                    {errors.firstName && <p className="form-error">{errors.firstName}</p>}
                  </div>

                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfLastName">
                      Last Name<span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="rfLastName"
                      className="form-input-res"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={(e) => update('lastName')(e.target.value)}
                    />
                    {errors.lastName && <p className="form-error">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfPhone">
                      Phone<span className="req-star">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      id="rfPhone"
                      className="form-input-res"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={(e) => update('phone')(e.target.value)}
                    />
                    {errors.phone && <p className="form-error">{errors.phone}</p>}
                  </div>

                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfEmail">
                      Email<span className="req-star">*</span>
                    </label>
                    <input
                      type="email"
                      id="rfEmail"
                      className="form-input-res"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => update('email')(e.target.value)}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfDate">
                      Date<span className="req-star">*</span>
                    </label>
                    <input
                      type="date"
                      id="rfDate"
                      className="form-input-res"
                      min={today}
                      value={form.date}
                      onChange={(e) => update('date')(e.target.value)}
                    />
                    {errors.date && <p className="form-error">{errors.date}</p>}
                  </div>

                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfTime">
                      Time<span className="req-star">*</span>
                    </label>
                    <select
                      id="rfTime"
                      className="form-input-res"
                      value={form.time}
                      onChange={(e) => update('time')(e.target.value)}
                    >
                      <option value="">Select a slot</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    {errors.time && <p className="form-error">{errors.time}</p>}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfNumber">
                      Guests<span className="req-star">*</span>
                    </label>
                    <select
                      id="rfNumber"
                      className="form-input-res"
                      value={form.guests}
                      onChange={(e) => update('guests')(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((count) => (
                        <option key={count} value={String(count)}>
                          {count} {count === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                      <option value="15">15 Guests</option>
                      <option value="20">20 Guests</option>
                    </select>
                    {errors.guests && <p className="form-error">{errors.guests}</p>}
                  </div>

                  <div className="form-item-res">
                    <label className="form-label-res" htmlFor="rfSeating">
                      Seating
                    </label>
                    <select
                      id="rfSeating"
                      className="form-input-res"
                      value={form.seating}
                      onChange={(e) => update('seating')(e.target.value)}
                    >
                      <option value="">No preference</option>
                      {SEATING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-item-res">
                  <label className="form-label-res" htmlFor="rfNotes">
                    Occasion or Requests
                  </label>
                  <input
                    type="text"
                    id="rfNotes"
                    className="form-input-res"
                    placeholder="Birthday, anniversary, high chair needed…"
                    value={form.notes}
                    onChange={(e) => update('notes')(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-submit-res">
                  Confirm Reservation
                </button>

                <p className="booking-card-note" style={{ marginTop: '14px', textAlign: 'center' }}>
                  Prefer to talk? Call{' '}
                  <a href="tel:+917488260572" style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>
                    +91 74882 60572
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}