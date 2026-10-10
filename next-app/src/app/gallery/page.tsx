'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import SubpageHero from '@/components/SubpageHero';

type Category = 'dishes' | 'restaurant';

interface GalleryPhoto {
  src: string;
  caption: string;
  category: Category;
}

const IMG = '/assets/images/WhatsApp-Image-2026-02-03-at';

const DISH_PHOTOS: GalleryPhoto[] = [
  // 8.01.x series – grilled starters, kebabs and plated mains
  ...[
    '8.01.34-PM-1', '8.01.34-PM', '8.01.35-PM-1', '8.01.35-PM',
    '8.01.36-PM-1', '8.01.36-PM-2', '8.01.36-PM', '8.01.37-PM-1',
    '8.01.37-PM', '8.01.38-PM', '8.01.39-PM-1', '8.01.39-PM-2',
    '8.01.39-PM', '8.01.40-PM-1', '8.01.40-PM', '8.01.41-PM-1',
    '8.01.41-PM', '8.01.42-PM-1', '8.01.42-PM-2', '8.01.42-PM',
    '8.01.43-PM-1', '8.01.43-PM-2', '8.01.43-PM', '8.01.44-PM-1',
    '8.01.45-PM-1', '8.01.45-PM', '8.01.46-PM-1', '8.01.46-PM',
  ].map((id) => ({
    src: `${IMG}-${id}-300x300.jpeg`,
    caption: 'From our charcoal kitchen',
    category: 'dishes' as Category,
  })),

  // 2.36.x series – curries, rice and fried accompaniments
  ...[
    '2.36.10-PM-2', '2.36.10-PM', '2.36.11-PM',
    '2.36.12-PM-1', '2.36.12-PM-2', '2.36.12-PM',
    '2.36.13-PM-1', '2.36.13-PM',
    '2.36.14-PM-1', '2.36.14-PM-2', '2.36.14-PM',
    '2.36.15-PM-1', '2.36.15-PM-2', '2.36.15-PM',
  ].map((id) => ({
    src: `${IMG}-${id}-300x300.jpeg`,
    caption: 'Cooked fresh to order',
    category: 'dishes' as Category,
  })),
];

const DISH = '/assets/images/dishes';

/**
 * Real photography of the restaurant's own dishes.
 *
 * Higher quality than the guest snapshots, and a few of these dishes are not on
 * the current menu sheet, so they are collected separately.
 */
const DISH_STILLS: GalleryPhoto[] = [
  'Palak paneer.webp',
  'Chicken muradabadi biryani.webp',
  'Chicken tandoori Afghani biryani.webp',
  'Chicken tandoori patyala leg kawab biryani.webp',
  'Chicken tandoori kawab biryani.webp',
  'Chicken tandoori butter masala.webp',
  'Chicken patyala leg kawab.webp',
  'afghani_kabab.webp',
  'Veg mashroom biryani.webp',
  'Veg mashroom roll.webp',
].map((file) => ({
  src: `${DISH}/${file}`,
  caption: 'Straight from our kitchen',
  category: 'dishes' as Category,
}));

const RESTAURANT_PHOTOS: GalleryPhoto[] = [
  {
    src: '/assets/images/zk-768x442.jpeg',
    caption: 'PM Zaika on Shersha Road, Patna City',
    category: 'restaurant',
  },
  {
    src: '/assets/images/food_royal_thali.jpg',
    caption: 'A full royal thali, served fresh',
    category: 'restaurant',
  },
  {
    src: '/assets/images/ChatGPT-Image-Jan-9-2026-06_42_49-PM-1.png',
    caption: 'The PM Zaika crest',
    category: 'restaurant',
  },
];

const PHOTOS: GalleryPhoto[] = [...DISH_STILLS, ...DISH_PHOTOS, ...RESTAURANT_PHOTOS];

const FILTERS: Array<{ id: 'all' | Category; label: string }> = [
  { id: 'all', label: 'All Photos' },
  { id: 'dishes', label: 'From The Kitchen' },
  { id: 'restaurant', label: 'The Restaurant' },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? PHOTOS : PHOTOS.filter((photo) => photo.category === filter)),
    [filter]
  );

  const close = useCallback(() => setLightboxIndex(null), []);

  const step = useCallback(
    (direction: 1 | -1) => {
      setLightboxIndex((current) => {
        if (current === null) return current;
        // Wrap around so the arrows never dead-end.
        return (current + direction + visible.length) % visible.length;
      });
    },
    [visible.length]
  );

  // Keyboard navigation for the lightbox.
  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };

    window.addEventListener('keydown', onKeyDown);
    // Prevent the page behind the overlay from scrolling.
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, close, step]);

  /** Switching collections invalidates the lightbox, so reset both together. */
  const selectFilter = (id: 'all' | Category) => {
    setFilter(id);
    setLightboxIndex(null);
  };

  const active = lightboxIndex === null ? null : visible[lightboxIndex];

  return (
    <>
      <SubpageHero
        eyebrow="Our Gallery"
        title="A look inside"
        accent="the kitchen."
        description="Charcoal-grilled starters, slow-simmered gravies and the dining room where it all happens. Tap any photo to view it larger."
        crumb="Gallery"
      />

      {/* =========================================================================
           PHOTO WALL
           ========================================================================= */}
      <section className="subpage-section">
        <div className="container">
          <div className="section-header-center" style={{ marginBottom: '32px' }}>
            <div className="section-eyebrow">{PHOTOS.length} Photographs</div>
            <h2 className="section-title">Straight from our kitchen.</h2>
            <p className="section-subtitle">
              Every dish below is cooked to order — nothing is plated for the camera.
            </p>
          </div>

          <div className="gallery-filters">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`gallery-filter-pill ${filter === option.id ? 'active' : ''}`}
                onClick={() => selectFilter(option.id)}
                aria-pressed={filter === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="gallery-empty">No photos in this collection yet.</p>
          ) : (
            <div className="gallery-masonry">
              {visible.map((photo, index) => (
                <button
                  type="button"
                  key={photo.src}
                  className="gallery-tile"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`View photo: ${photo.caption}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt={photo.caption} loading="lazy" />
                  <span className="gallery-tile-overlay">
                    <span className="gallery-tile-caption">{photo.caption}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
           LIGHTBOX
           ========================================================================= */}
      {active && lightboxIndex !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={close}
        >
          <span className="lightbox-counter">
            {lightboxIndex + 1} / {visible.length}
          </span>

          <button
            type="button"
            className="lightbox-btn lightbox-close"
            onClick={close}
            aria-label="Close viewer"
          >
            &times;
          </button>

          <button
            type="button"
            className="lightbox-btn lightbox-prev"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
          >
            &#8249;
          </button>

          <button
            type="button"
            className="lightbox-btn lightbox-next"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
          >
            &#8250;
          </button>

          <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.src} alt={active.caption} />
            <figcaption className="lightbox-caption">{active.caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}