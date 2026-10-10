import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

import { adminAuth } from '@/lib/firebase/admin';
import { COLLECTIONS, getDb } from '@/lib/db';
import { ADMIN_COOKIE, ADMIN_EMAILS, LOCAL_ADMIN_PASSWORD, persistenceMode } from '@/lib/env';
import type { AdminRole } from '@/lib/users/service';

export interface AdminSession {
  uid: string;
  email: string;
  /** `firebase` or `local` – surfaced in the dashboard footer. */
  provider: 'firebase' | 'local';
}

export class AuthError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

const LOCAL_PREFIX = 'local.';

function localSignature(): string {
  return createHmac('sha256', LOCAL_ADMIN_PASSWORD).update('pm-zaika-admin').digest('hex');
}

/** Issues the opaque cookie value used when running without Firebase Auth. */
export function issueLocalAdminToken(): string {
  return `${LOCAL_PREFIX}${localSignature()}`;
}

function verifyLocalAdminToken(value: string | undefined): boolean {
  if (!value?.startsWith(LOCAL_PREFIX)) return false;
  const provided = Buffer.from(value.slice(LOCAL_PREFIX.length));
  const expected = Buffer.from(localSignature());
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function isLocalMode(): boolean {
  return persistenceMode() === 'local';
}

/** Constant-time password check used only in local persistence mode. */
export function verifyLocalPassword(password: string): boolean {
  const provided = Buffer.from(password);
  const expected = Buffer.from(LOCAL_ADMIN_PASSWORD);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/** Admins may be allow-listed via env or granted a role from the dashboard. */
async function isKnownAdmin(email: string): Promise<boolean> {
  if (ADMIN_EMAILS.includes(email)) return true;

  try {
    const role = await (await getDb())
      .collection<AdminRole>(COLLECTIONS.adminRoles)
      .get(email);
    return Boolean(role?.isAdmin);
  } catch {
    // Firestore unavailable – fall back to the env allow-list.
    return false;
  }
}

/**
 * Verifies a Firebase ID token and checks the e-mail against the admin allow-list.
 * Throws `AuthError` on any failure so callers never accidentally continue.
 */
export async function verifyAdminIdToken(idToken: string): Promise<AdminSession> {
  let decoded: { uid: string; email?: string; email_verified?: boolean };
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    throw new AuthError('Your session has expired. Please sign in again.', 401);
  }

  const email = (decoded.email ?? '').toLowerCase();
  if (!email) throw new AuthError('This account has no e-mail address.', 403);

  if (!(await isKnownAdmin(email))) {
    throw new AuthError(
      ADMIN_EMAILS.length === 0
        ? 'No admin is configured. Set ADMIN_EMAILS or grant a role from the dashboard.'
        : `${email} is not authorised for the kitchen dashboard.`,
      403
    );
  }

  return { uid: decoded.uid, email, provider: 'firebase' };
}

/** Reads and verifies the admin cookie on the incoming request. */
export async function requireAdmin(request: NextRequest): Promise<AdminSession> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!token) {
    throw new AuthError('Please sign in to the kitchen dashboard.', 401);
  }

  if (token.startsWith(LOCAL_PREFIX)) {
    if (!verifyLocalAdminToken(token)) throw new AuthError('Invalid session.', 401);
    return { uid: 'local-admin', email: 'kitchen@pmzaika.local', provider: 'local' };
  }

  return verifyAdminIdToken(token);
}

/**
 * Server-component variant of `requireAdmin`: reads the cookie directly and
 * returns `null` instead of throwing, so layouts can redirect to the login page.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  if (token.startsWith(LOCAL_PREFIX)) {
    if (!verifyLocalAdminToken(token)) return null;
    return { uid: 'local-admin', email: 'kitchen@pmzaika.local', provider: 'local' };
  }

  try {
    return await verifyAdminIdToken(token);
  } catch {
    return null;
  }
}