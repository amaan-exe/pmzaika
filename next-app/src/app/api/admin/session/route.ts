import type { NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  isFirebaseClientConfigured,
  isFirebaseConfigured,
  persistenceMode,
} from '@/lib/env';
import {
  issueLocalAdminToken,
  isLocalMode,
  requireAdmin,
  verifyAdminIdToken,
  verifyLocalPassword,
  type AdminSession,
} from '@/lib/auth/admin';
import {
  apiError,
  clientIp,
  json,
  rateLimit,
  readJson,
  withErrorHandling,
} from '@/lib/http/api';
import { adminLoginSchema } from '@/lib/orders/schema';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12,
};

const capabilities = () => ({
  persistence: persistenceMode(),
  firebaseAuth: isFirebaseConfigured() && isFirebaseClientConfigured(),
  passwordAuth: true,
});

/**
 * Kitchen dashboard sign-in.
 *
 * With Firebase configured, the client signs in via Firebase Auth and posts the
 * resulting ID token. Without Firebase (local persistence mode) a shared kitchen
 * password is accepted so the dashboard stays usable out of the box.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { limited, retryAfterSeconds } = rateLimit(
    `admin-login:${clientIp(request)}`,
    8,
    10 * 60 * 1000
  );

  if (limited) {
    return json(
      { ok: false, error: 'Too many sign-in attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const payload = adminLoginSchema.parse(await readJson(request));

  let session: AdminSession;

  if (payload.idToken) {
    session = await verifyAdminIdToken(payload.idToken);
  } else if (payload.password) {
    if (!verifyLocalPassword(payload.password)) {
      return apiError('Incorrect kitchen password', 401);
    }
    session = { uid: 'local-admin', email: 'kitchen@pmzaika.local', provider: 'local' };
  } else {
    return apiError('Provide an ID token or a kitchen password', 400);
  }

  const cookieStore = await cookies();
  // Firebase sessions keep the ID token so it can be re-verified on every call.
  const cookieValue =
    session.provider === 'local' ? issueLocalAdminToken() : payload.idToken!;
  cookieStore.set(ADMIN_COOKIE, cookieValue, COOKIE_OPTIONS);

  return json({
    ok: true,
    session: { email: session.email, provider: session.provider },
    capabilities: capabilities(),
  });
});

/** Returns the current session so the dashboard can restore itself on reload. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const session = await requireAdmin(request);
    return json({
      ok: true,
      session: { email: session.email, provider: session.provider },
      capabilities: capabilities(),
    });
  } catch {
    return json({
      ok: false,
      session: null,
      capabilities: capabilities(),
    });
  }
});

export const DELETE = withErrorHandling(async () => {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return json({ ok: true });
});