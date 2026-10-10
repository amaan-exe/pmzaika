import type { NextRequest } from 'next/server';

import { requireCustomer } from '@/lib/auth/user';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { profileSchema } from '@/lib/orders/schema';
import { getProfile, updateProfile } from '@/lib/users/service';

export const runtime = 'nodejs';

/** Customer profile and saved delivery addresses. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireCustomer(request);
  const profile = await getProfile(session.uid, session.email);

  return json({ ok: true, profile });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await requireCustomer(request);
  const payload = profileSchema.parse(await readJson(request));

  const profile = await updateProfile(session.uid, session.email, payload);
  return json({ ok: true, profile });
});