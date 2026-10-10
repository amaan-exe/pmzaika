import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, withErrorHandling } from '@/lib/http/api';
import { listAdminRoles, listUsers } from '@/lib/users/service';

export const runtime = 'nodejs';

/** Customer directory with per-customer spend, plus the admin role list. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const [users, roles] = await Promise.all([
    listUsers(Number(request.nextUrl.searchParams.get('limit') ?? 100)),
    listAdminRoles(),
  ]);

  return json({ ok: true, count: users.length, users, admins: roles });
});