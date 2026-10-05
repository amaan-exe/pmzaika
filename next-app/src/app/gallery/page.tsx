'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const GALLERY_IMAGES = [
  // Row 1
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.34-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.34-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.35-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.35-PM-300x300.jpeg',
  // Row 2
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.36-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.36-PM-2-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.36-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.37-PM-1-300x300.jpeg',
  // Row 3
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.37-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.38-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.39-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.39-PM-2-300x300.jpeg',
  // Row 4
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.39-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.40-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.40-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.41-PM-1-300x300.jpeg',
  // Row 5
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.41-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.42-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.42-PM-2-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.42-PM-300x300.jpeg',
  // Row 6
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.43-PM-1-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.43-PM-2-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.43-PM-300x300.jpeg',
  '/assets/images/WhatsApp-Image-2026-02-03-at-8.01.44-PM-1-300x300.jpeg',
];

export default function GalleryPage() {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImg(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Banner (Matching Screenshot 4: "Our Gallery" / "Home > Gallery") */}
      <section className="subpage-banner bg-courier">
        <div className="banner-shape-left"></div>
        <div className="banner-shape-right"></div>
        <div className="container subpage-banner-content">
          <h1 className="subpage-banner-title">Our Gallery</h1>
          <div className="subpage-breadcrumb">
            <Link href="/">Home</Link>
            <span>&gt;</span>
            <span>Gallery</span>
          </div>
        </div>
      </section>

      {/* Gallery Section (Matching Screenshot 4: 24 Client Photos in 4 columns) */}
      <section className="gallery-section">
        <div className="container">
          <span className="gallery-tag">GALLERY</span>
          <h2 className="gallery-heading">Photos From Our Clients.</h2>

          <div className="gallery-grid-24">
            {GALLERY_IMAGES.map((src, index) => (
              <div
                key={index}
                className="gallery-card"
                onClick={() => setSelectedImg(src)}
              >
                <img
                  src={src}
                  alt={`PM Zaika Client Photo ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImg && (
        <div
          className="gallery-lightbox-modal active"
          onClick={() => setSelectedImg(null)}
        >
          <span
            className="lightbox-close-btn"
            onClick={() => setSelectedImg(null)}
          >
            &times;
          </span>
          <img
            src={selectedImg}
            alt="Enlarged Gallery View"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
