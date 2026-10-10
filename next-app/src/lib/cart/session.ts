import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

import { SESSION_COOKIE } from '@/lib/env';

const SESSION_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Returns the current cart session id, creating one if needed.
 *
 * The id is an opaque httpOnly cookie, so the server-side cart works across
 * devices once the customer has signed in elsewhere, and a lost cookie can never
 * be guessed by another visitor.
 */
export async function ensureCartSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing && SESSION_PATTERN.test(existing)) {
    return existing;
  }

  const sessionId = randomUUID();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return sessionId;
}

/** Reads the session id without creating one (safe for public read endpoints). */
export async function readCartSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  return existing && SESSION_PATTERN.test(existing) ? existing : null;
}