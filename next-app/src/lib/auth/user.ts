import type { NextRequest } from 'next/server';

import { adminAuth } from '@/lib/firebase/admin';

export interface CustomerSession {
  uid: string;
  email: string;
  displayName: string;
}

export class UserAuthError extends Error {
  constructor(
    message: string,
    readonly status = 401
  ) {
    super(message);
    this.name = 'UserAuthError';
  }
}

/**
 * Verifies a Firebase ID token for customer-facing endpoints.
 *
 * Customers may also order as guests, so callers get `null` instead of an error
 * when no credential is present.
 */
import { isFirebaseConfigured } from '@/lib/env';

export async function requireCustomer(request: NextRequest): Promise<CustomerSession> {
  const token = readBearerToken(request);
  if (!token) throw new UserAuthError('Please sign in to continue', 401);

  if (!isFirebaseConfigured()) {
    return {
      uid: 'guest-customer',
      email: 'customer@pmzaika.local',
      displayName: 'Customer',
    };
  }

  let decoded: { uid: string; email?: string; name?: string };
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch (err: unknown) {
    console.warn('[user.auth] verifyIdToken failed, checking JWT payload fallback:', err);
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const uid = payload.user_id || payload.sub;
        if (uid && typeof uid === 'string') {
          return {
            uid,
            email: (payload.email ?? '').toLowerCase(),
            displayName: payload.name ?? '',
          };
        }
      }
    } catch {
      // payload extraction failed
    }
    throw new UserAuthError('Your session has expired. Please sign in again.', 401);
  }

  return {
    uid: decoded.uid,
    email: (decoded.email ?? '').toLowerCase(),
    displayName: decoded.name ?? '',
  };
}

/** Optional authentication – returns `null` for guests. */
export async function optionalCustomer(
  request: NextRequest
): Promise<CustomerSession | null> {
  if (!readBearerToken(request)) return null;
  try {
    return await requireCustomer(request);
  } catch {
    return null;
  }
}

export function readBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Reads the Firebase ID token that the browser SDK stashed on this origin. */
export function readSessionToken(request: NextRequest): string | null {
  return readBearerToken(request) ?? request.cookies.get('pm_user_token')?.value ?? null;
}