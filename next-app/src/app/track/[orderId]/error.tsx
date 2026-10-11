'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TrackOrderErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TrackOrder ErrorBoundary caught]:', error);
  }, [error]);

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '60px auto',
        padding: '40px 24px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e8e2d8',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '14px' }}>🍽️</div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', marginBottom: '10px' }}>
        Unable to Load Order Status
      </h2>
      <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
        We encountered a momentary glitch retrieving this order. You can refresh the status, or view all your orders in your PM Zaika account.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F5A623 0%, #F05D23 100%)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(240, 93, 35, 0.25)',
          }}
        >
          Reload Status
        </button>
        <Link
          href="/my-orders"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            background: '#F3F4F6',
            color: '#1F2937',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            border: '1px solid #E5E7EB',
          }}
        >
          Go to My Orders
        </Link>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            background: '#F3F4F6',
            color: '#1F2937',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            border: '1px solid #E5E7EB',
          }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
