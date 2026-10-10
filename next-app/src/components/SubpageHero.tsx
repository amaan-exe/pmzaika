import React from 'react';
import Link from 'next/link';

export interface SubpageHeroProps {
  eyebrow: string;
  title: string;
  /** Rendered in the amber gradient as the second line. */
  accent: string;
  description: string;
  /** Current page name, shown in the breadcrumb. */
  crumb: string;
}

/**
 * Shared hero banner for every non-home page.
 *
 * Deliberately built from the same primitives as the home hero — eyebrow pill,
 * gradient accent line, breadcrumb — so subpages feel like one continuous
 * site rather than a set of templates bolted on.
 */
export default function SubpageHero({
  eyebrow,
  title,
  accent,
  description,
  crumb,
}: SubpageHeroProps) {
  return (
    <section className="subpage-hero">
      {/* Decorative arch + glow, echoing the home hero's concentric arches. */}
      <div className="subpage-hero-decor" aria-hidden="true">
        <span className="subpage-hero-arch subpage-hero-arch--outer" />
        <span className="subpage-hero-arch subpage-hero-arch--inner" />
        <span className="subpage-hero-glow" />
      </div>

      <div className="container subpage-hero-inner">
        <div className="eyebrow-pill subpage-hero-eyebrow">
          <span className="eyebrow-dot" />
          <span>{eyebrow}</span>
        </div>

        <h1 className="subpage-hero-title">
          {title}
          <br />
          <span className="gradient-text-amber">{accent}</span>
        </h1>

        <p className="subpage-hero-desc">{description}</p>

        <nav className="subpage-hero-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="crumb-divider" aria-hidden="true" />
          <span className="crumb-current">{crumb}</span>
        </nav>
      </div>
    </section>
  );
}