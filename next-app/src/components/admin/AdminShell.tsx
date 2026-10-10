'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { signOut } from '@/lib/client/adminApi';
import type { AdminSessionInfo } from '@/lib/admin/types';

const NAV = [
  { href: '/admin', label: 'Overview', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { href: '/admin/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m-6 7h6m-6 4h4', section: 'Kitchen' },
  { href: '/admin/reservations', label: 'Reservations', icon: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', section: 'Kitchen' },
  { href: '/admin/menu', label: 'Menu', icon: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm4 5h8M8 12h8m-8 4h5' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 13h6', section: 'Kitchen' },
  { href: '/admin/payments', label: 'Payments', icon: 'M3 10h18M7 15h2M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z' },
  { href: '/admin/users', label: 'Customers', icon: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 0 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', section: 'Store' },
  { href: '/admin/settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z', section: 'Store' },
];

export interface AdminShellProps {
  session: AdminSessionInfo;
  /** Live count of orders awaiting payment, shown as a nav badge. */
  pendingCount?: number;
  children: React.ReactNode;
}

export default function AdminShell({ session, pendingCount = 0, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }, [router]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  // Section headers are derived up front rather than tracked while mapping, so
  // nothing is mutated during render.
  const navItems = NAV.map((item, index) => ({
    item,
    showLabel: Boolean(item.section && item.section !== NAV[index - 1]?.section),
  }));

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/pm_zaika_circular_logo.png" alt="PM Zaika" />
          <div>
            <div className="admin-brand-name">PM Zaika</div>
            <div className="admin-brand-sub">Kitchen Desk</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ item, showLabel }) => {
            return (
              <React.Fragment key={item.href}>
                {showLabel && <div className="admin-nav-label">{item.section}</div>}
                <Link
                  href={item.href}
                  className={`admin-nav-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                  {item.href === '/admin/orders' && pendingCount > 0 && (
                    <span className="admin-nav-badge">{pendingCount}</span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div>
            Signed in as
            <div className="admin-session-email">{session.email}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/" className="admin-btn admin-btn--sm" style={{ flex: 1 }}>
              Site
            </Link>
            <button
              type="button"
              className="admin-btn admin-btn--sm admin-btn--danger"
              style={{ flex: 1 }}
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? '…' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}