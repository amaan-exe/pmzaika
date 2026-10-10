'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function HeroDancingPlates() {
  const containerRef = useRef<HTMLDivElement>(null);
  const berriesRef = useRef<HTMLDivElement>(null);
  const saladRef = useRef<HTMLDivElement>(null);
  const salmonRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const [isDancing, setIsDancing] = useState(false);
  const [activePlate, setActivePlate] = useState<string | null>(null);

  // References to keep GSAP timelines for idle and dance
  const idleTlRef = useRef<gsap.core.Timeline | null>(null);
  const danceTlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const berries = berriesRef.current;
      const salad = saladRef.current;
      const salmon = salmonRef.current;
      const badge = badgeRef.current;

      if (!berries || !salad || !salmon) return;

      // -----------------------------------------------------------------------
      // 1. ENTRANCE TIMELINE
      // -----------------------------------------------------------------------
      const entranceTl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      gsap.set([salad, berries, salmon], { opacity: 0, scale: 0.7 });
      gsap.set(salad, { y: 60, rotation: -8 });
      gsap.set(berries, { x: 80, y: -60, rotation: 20 });
      gsap.set(salmon, { x: -80, y: 70, rotation: -18 });

      entranceTl
        .to(salad, {
          opacity: 1,
          scale: 1,
          y: 0,
          rotation: 0,
          duration: 1.1,
          ease: 'elastic.out(1, 0.75)',
        })
        .to(
          berries,
          {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.95,
            ease: 'back.out(1.8)',
          },
          '-=0.75'
        )
        .to(
          salmon,
          {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 1.0,
            ease: 'back.out(1.8)',
          },
          '-=0.75'
        )
        .fromTo(
          badge,
          { opacity: 0, y: 15, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.4'
        );

      // -----------------------------------------------------------------------
      // 2. IDLE FLOATING TIMELINE
      // -----------------------------------------------------------------------
      const idleTl = gsap.timeline({ repeat: -1, yoyo: true });

      idleTl
        .to(
          salad,
          {
            y: -12,
            rotation: 1.2,
            duration: 4.6,
            ease: 'sine.inOut',
          },
          0
        )
        .to(
          berries,
          {
            x: 7,
            y: -18,
            rotation: -2.5,
            duration: 3.8,
            ease: 'sine.inOut',
          },
          0
        )
        .to(
          salmon,
          {
            x: -8,
            y: -15,
            rotation: 2.2,
            duration: 4.2,
            ease: 'sine.inOut',
          },
          0
        );

      idleTlRef.current = idleTl;

      // -----------------------------------------------------------------------
      // 3. DANCE CHOREOGRAPHY TIMELINE
      // -----------------------------------------------------------------------
      const danceTl = gsap.timeline({
        paused: true,
        repeat: -1,
        defaults: { ease: 'sine.inOut', duration: 1.15 },
      });

      // Beat 1: Joyful expansion and dramatic swoop
      danceTl
        .to(salad, { x: -65, y: -45, rotation: -12, scale: 1.06 }, 0)
        .to(berries, { x: -160, y: -65, rotation: 26, scale: 1.16 }, 0)
        .to(salmon, { x: 150, y: 40, rotation: -18, scale: 1.14 }, 0)

        // Beat 2: Cross-over orbit & elevation
        .to(salad, { x: 45, y: -25, rotation: 8, scale: 1.02 }, 1.15)
        .to(berries, { x: -90, y: 80, rotation: -20, scale: 1.08 }, 1.15)
        .to(salmon, { x: 110, y: -95, rotation: 22, scale: 1.12 }, 1.15)

        // Beat 3: Playful wave & pirouette tilt
        .to(salad, { x: 30, y: 35, rotation: -6, scale: 1.07 }, 2.3)
        .to(berries, { x: 40, y: -75, rotation: 16, scale: 1.14 }, 2.3)
        .to(salmon, { x: -60, y: 50, rotation: -14, scale: 1.08 }, 2.3)

        // Beat 4: Float back into rhythm
        .to(salad, { x: -65, y: -45, rotation: -12, scale: 1.06 }, 3.45)
        .to(berries, { x: -160, y: -65, rotation: 26, scale: 1.16 }, 3.45)
        .to(salmon, { x: 150, y: 40, rotation: -18, scale: 1.14 }, 3.45);

      danceTlRef.current = danceTl;
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ---------------------------------------------------------------------------
  // INTERACTIVE HOVER / POINTER EVENTS
  // ---------------------------------------------------------------------------
  const startDance = () => {
    setIsDancing(true);
    idleTlRef.current?.pause();

    if (danceTlRef.current) {
      danceTlRef.current.play();
    }
  };

  const stopDance = () => {
    setIsDancing(false);
    setActivePlate(null);

    if (danceTlRef.current) {
      danceTlRef.current.pause();
    }

    // Gracefully ease all plates back to their baseline floating home
    const berries = berriesRef.current;
    const salad = saladRef.current;
    const salmon = salmonRef.current;

    if (berries && salad && salmon) {
      gsap.to([berries, salad, salmon], {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.85,
        ease: 'elastic.out(1, 0.55)',
        onComplete: () => {
          idleTlRef.current?.play();
        },
      });
    }
  };

  // ---------------------------------------------------------------------------
  // MAGNETIC MOUSE BUOYANCY (Adds micro-inertia to the dance)
  // ---------------------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isDancing) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    // Subtle magnetic sway overlay
    if (saladRef.current) {
      gsap.to(saladRef.current, {
        xPercent: relX * 18,
        yPercent: relY * 18,
        duration: 0.5,
        ease: 'power1.out',
      });
    }
    if (berriesRef.current) {
      gsap.to(berriesRef.current, {
        xPercent: -relX * 28,
        yPercent: -relY * 24,
        duration: 0.45,
        ease: 'power1.out',
      });
    }
    if (salmonRef.current) {
      gsap.to(salmonRef.current, {
        xPercent: relX * 26,
        yPercent: relY * 22,
        duration: 0.45,
        ease: 'power1.out',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // CLICK TO EXECUTE A 360° DANCE PIROUETTE
  // ---------------------------------------------------------------------------
  const handlePlateClick = (plateName: string, elementRef: React.RefObject<HTMLDivElement | null>) => {
    setActivePlate(plateName);

    const el = elementRef.current;
    if (!el) return;

    // Solo celebratory acrobatic flip
    gsap.to(el, {
      rotation: '+=360',
      scale: 1.25,
      duration: 0.8,
      ease: 'back.out(1.8)',
      onComplete: () => {
        gsap.to(el, {
          scale: isDancing ? 1.1 : 1,
          duration: 0.4,
          ease: 'power2.out',
        });
      },
    });

    // Companion bounce
    const companions = [berriesRef.current, saladRef.current, salmonRef.current].filter(
      (item) => item !== el && item !== null
    );

    if (companions.length > 0) {
      gsap.to(companions, {
        y: '-=25',
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`hero-dishes-composition gsap-enabled ${isDancing ? 'is-dancing' : ''}`}
      onMouseEnter={startDance}
      onMouseLeave={stopDance}
      onMouseMove={handleMouseMove}
      style={{ cursor: isDancing ? 'grab' : 'pointer' }}
      title="Hover over the plates to watch them dance across the page! Click any plate to spin."
    >
      {/* 1. Top-Right Raspberry Plate */}
      <div
        ref={berriesRef}
        className={`dish-item dish-berries ${activePlate === 'berries' ? 'is-solo' : ''}`}
        onClick={() => handlePlateClick('berries', berriesRef)}
      >
        <img
          src="/assets/images/hero_plate_berries.png"
          alt="Fresh Berry Garnish"
          className="dish-img"
          draggable={false}
        />
        {isDancing && <span className="dance-sparkle dance-sparkle--top">✨</span>}
      </div>

      {/* 2. Center Signature Fresh Salad Platter */}
      <div
        ref={saladRef}
        className={`dish-item dish-salad ${activePlate === 'salad' ? 'is-solo' : ''}`}
        onClick={() => handlePlateClick('salad', saladRef)}
      >
        <img
          src="/assets/images/hero_plate_salad.png"
          alt="Fresh Healthy Salad Platter"
          className="dish-img"
          draggable={false}
        />
        {isDancing && <span className="dance-sparkle dance-sparkle--center">🌟</span>}
      </div>

      {/* 3. Bottom-Left Salmon Poke Bowl with Chopsticks */}
      <div
        ref={salmonRef}
        className={`dish-item dish-salmon ${activePlate === 'salmon' ? 'is-solo' : ''}`}
        onClick={() => handlePlateClick('salmon', salmonRef)}
      >
        <img
          src="/assets/images/hero_plate_salmon.png"
          alt="Signature Poke Bowl"
          className="dish-img"
          draggable={false}
        />
        {isDancing && <span className="dance-sparkle dance-sparkle--bottom">✨</span>}
      </div>

      {/* Dynamic Interactive Hint Pill */}
      <div
        ref={badgeRef}
        className={`hero-dance-badge ${isDancing ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isDancing) {
            handlePlateClick('salad', saladRef);
          } else {
            startDance();
          }
        }}
      >
        <span className="dance-note-icon">{isDancing ? '💃' : '✨'}</span>
        <span className="dance-badge-text">
          {isDancing ? 'Culinary Dance in Motion • Click to spin!' : 'Hover dishes to watch them dance!'}
        </span>
      </div>
    </div>
  );
}
