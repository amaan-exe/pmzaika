'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ApiError, signIn } from '@/lib/client/adminApi';
import { firebaseAuth } from '@/lib/firebase/client';

interface Capabilities {
  persistence: 'firestore' | 'local';
  firebaseAuth: boolean;
  passwordAuth: boolean;
}

/** Turns Firebase auth codes into something a kitchen manager can act on. */
function formatError(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;

  const code = (caught as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and try again.';
    default:
      return caught instanceof Error
        ? caught.message
        : 'Could not sign in. Please try again.';
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);

  // Discover whether this deployment uses Firebase Auth or the shared password,
  // so the form shows only the fields that will actually work.
  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.capabilities) return;
        setCapabilities(payload.capabilities);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const usesPassword = capabilities ? capabilities.passwordAuth : true;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (usesPassword) {
        // No Firebase configured: the shared kitchen password is accepted.
        await signIn({ password });
      } else {
        // Firebase Auth exchanges the credentials for an ID token, which the
        // server verifies on every subsequent request.
        const auth = firebaseAuth();
        if (!auth) throw new Error('Firebase is not configured on this browser.');

        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();

        await signIn({ idToken });
      }

      router.replace('/admin');
      router.refresh();
    } catch (caught) {
      setError(formatError(caught));
      setBusy(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg-mesh"></div>
      <div className="admin-login-container">
        {/* Top return link */}
        <Link href="/" className="admin-login-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Return to PM Zaika Restaurant</span>
        </Link>

        <form className="admin-login-card" onSubmit={handleSubmit}>
          {/* Brand header */}
          <div className="admin-login-header">
            <div className="admin-login-logo-halo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="admin-login-logo"
                src="/assets/images/pm_zaika_circular_logo.png"
                alt="PM Zaika"
              />
            </div>

            <div className="admin-login-status-pill">
              <span className="admin-login-pulse-dot"></span>
              <span>KITCHEN OPERATIONS DESK</span>
            </div>

            <h1 className="admin-login-title">Staff Portal</h1>
            <p className="admin-login-sub">
              Sign in to manage live orders, menu catalog, coupons &amp; restaurant pricing.
            </p>
          </div>

          {error && (
            <div className="admin-alert admin-alert--error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!usesPassword && (
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="admin-email">
                Staff Email
              </label>
              <div className="admin-input-group">
                <span className="admin-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  id="admin-email"
                  type="email"
                  className="admin-input admin-input--with-icon"
                  autoComplete="username"
                  placeholder="manager@pmzaika.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="admin-field">
            <div className="admin-field-head">
              <label className="admin-form-label" htmlFor="admin-password">
                {usesPassword ? 'Kitchen Password' : 'Password'}
              </label>
            </div>

            <div className="admin-input-group">
              <span className="admin-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="admin-input admin-input--with-icon admin-input--with-action"
                autoComplete="current-password"
                placeholder={usesPassword ? 'Enter kitchen password' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn--primary admin-login-submit"
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="admin-spinner"></span>
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span>Sign in to Kitchen Desk</span>
                <span className="btn-arrow-icon">→</span>
              </>
            )}
          </button>


          <div className="admin-login-foot">
            <div className="admin-login-badges">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>⚡ Live Sync</span>
              <span>🛡️ Authorized Staff</span>
            </div>
            <div className="admin-login-engine-info">
              {capabilities
                ? `Active engine: ${capabilities.persistence === 'firestore' ? 'Cloud Firestore' : 'Local Database'}`
                : 'Connecting to database…'}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}