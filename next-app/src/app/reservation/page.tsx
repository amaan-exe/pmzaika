'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function ReservationPage() {
  const { showToast } = useCart();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: 'Patna',
    address: '',
    zip: '',
    dateTime: '',
    number: '',
    increase: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const phone = '917488260572';
    const msg = encodeURIComponent(
      `*🍽️ TABLE RESERVATION - PM ZAIKA RESTAURANT*\n\n` +
      `First Name: ${formData.firstName}\n` +
      `Last Name: ${formData.lastName}\n` +
      `Phone: ${formData.phone}\n` +
      `Email: ${formData.email}\n` +
      `City: ${formData.city}\n` +
      `Address: ${formData.address}\n` +
      `Pin-Code: ${formData.zip}\n` +
      `Date & Time: ${formData.dateTime}\n` +
      `Number of Guests: ${formData.number}\n` +
      (formData.increase ? `Increase Note: ${formData.increase}\n` : '') +
      `\nPlease confirm our table reservation. Thank you!`
    );

    showToast(`Reservation submitted for ${formData.firstName}! Opening WhatsApp... ✨`);
    setTimeout(() => {
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }, 400);
  };

  return (
    <>
      {/* Reservation Hero Banner (Matching Screenshot 4 & reservation.html) */}
      <section className="res-page-banner">
        <div className="banner-shape-left"></div>
        <div className="banner-shape-right"></div>
        <div className="container res-banner-content">
          <h1 className="res-banner-title">Reservation</h1>
          <div className="res-breadcrumb">
            <Link href="/">Home</Link>
            <span>&gt;</span>
            <span>Reservation</span>
          </div>
        </div>
      </section>

      {/* Reservation Form Main Section (Matching Screenshot 4 & 5) */}
      <div className="container">
        <div className="res-layout-grid">
          {/* Left Heading */}
          <div className="res-heading-col">
            <h2>Reservation Form</h2>
          </div>

          {/* Right Form Fields Matching Screenshot 4 & 5 */}
          <div className="res-form-wrapper">
            <h3 className="res-form-title">Reservation</h3>
            <p className="res-required-note">Fields marked with an <span>*</span> are required</p>

            <form id="pmZaikaFullResForm" onSubmit={handleSubmit}>
              {/* First Name */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfFirstName">
                  First Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="rfFirstName"
                  className="form-input-res"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfLastName">
                  Last Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="rfLastName"
                  className="form-input-res"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfPhone">
                  Phone <span className="req-star">*</span>
                </label>
                <input
                  type="tel"
                  id="rfPhone"
                  className="form-input-res"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfEmail">
                  Email <span className="req-star">*</span>
                </label>
                <input
                  type="email"
                  id="rfEmail"
                  className="form-input-res"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* City */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfCity">
                  City <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="rfCity"
                  className="form-input-res"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              {/* Address */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfAddress">
                  Address <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="rfAddress"
                  className="form-input-res"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              {/* Zip */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfZip">
                  Zip <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="rfZip"
                  className="form-input-res"
                  placeholder="Pin-Code"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  required
                />
              </div>

              {/* Date/Time */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfDateTime">
                  Date/Time <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="rfDateTime"
                  className="form-input-res"
                  placeholder="Date Of Reservation (e.g. Tomorrow 7:30 PM)"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  required
                />
              </div>

              {/* Number of Guests */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfNumber">
                  Number <span className="req-star">*</span>
                </label>
                <input
                  type="number"
                  id="rfNumber"
                  className="form-input-res"
                  placeholder="Number of Guest"
                  min="1"
                  max="100"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>

              {/* Increase Number of Guest */}
              <div className="form-item-res">
                <label className="form-label-res" htmlFor="rfIncrease">
                  Increase Number of Guest
                </label>
                <input
                  type="text"
                  id="rfIncrease"
                  className="form-input-res"
                  placeholder="please Contact-us"
                  value={formData.increase}
                  onChange={(e) => setFormData({ ...formData, increase: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-submit-res">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
