'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function BottomContactForm() {
  const pathname = usePathname();
  const { showToast } = useCart();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      showToast(`Thank you ${formData.name}! Your message has been sent successfully. ✨`);
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <section className="section-bottom-form">
      <div className="container">
        <div className="bottom-form-container">
          <form onSubmit={handleSubmit} id="standaloneBottomContactForm">
            <div className="form-group-bottom">
              <label className="form-label-bottom" htmlFor="contactName">
                Name
              </label>
              <input
                type="text"
                id="contactName"
                className="form-input-bottom"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group-bottom">
              <label className="form-label-bottom" htmlFor="contactEmail">
                Email
              </label>
              <input
                type="email"
                id="contactEmail"
                className="form-input-bottom"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group-bottom">
              <label className="form-label-bottom" htmlFor="contactMessage">
                Message
              </label>
              <textarea
                id="contactMessage"
                className="form-input-bottom"
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-send-bottom" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
