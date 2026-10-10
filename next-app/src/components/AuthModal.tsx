'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { isAuthOpen, closeAuth, signIn } = useAuth();
  const [createAccount, setCreateAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isAuthOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password, createAccount);
    } catch (caught) {
      const code = (caught as { code?: string })?.code;
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : code === 'auth/email-already-in-use'
            ? 'An account already exists for this email.'
            : caught instanceof Error
              ? caught.message
              : 'Could not sign in. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={closeAuth}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-modal-close" type="button" onClick={closeAuth} aria-label="Close login">
          ×
        </button>
        <span className="auth-modal-kicker">PM Zaika account</span>
        <h2 id="auth-modal-title">{createAccount ? 'Create your account' : 'Welcome back'}</h2>
        <p>Sign in before ordering so we can keep your order history and updates together.</p>

        {error && <div className="auth-modal-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={createAccount ? 'new-password' : 'current-password'}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            className="auth-modal-submit"
            type="submit"
            disabled={busy}
            style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #F05D23 100%)',
              color: '#ffffff',
              minHeight: '48px',
            }}
          >
            {busy ? 'Please wait…' : createAccount ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          className="auth-modal-switch"
          type="button"
          onClick={() => {
            setCreateAccount((value) => !value);
            setError(null);
          }}
        >
          {createAccount ? '← Already have an account? Sign in' : 'New here? Create an account →'}
        </button>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #ede4d8', textAlign: 'center' }}>
          <Link
            className="auth-modal-admin-link"
            href="/admin/login"
            onClick={closeAuth}
            style={{ marginTop: 0, fontSize: '12px', color: '#8c7e70' }}
          >
            Kitchen / Admin Team Desk →
          </Link>
        </div>
      </section>
    </div>
  );
}
