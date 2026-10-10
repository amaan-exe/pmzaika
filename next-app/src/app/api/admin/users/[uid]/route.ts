import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { adminRoleSchema } from '@/lib/orders/schema';
import { setAdminRole } from '@/lib/users/service';

export const runtime = 'nodejs';

/** Grants or revokes kitchen dashboard access for an e-mail address. */
export const PATCH = withErrorHandling(
  async (_request: NextRequest, { params }: { params: Promise<{ uid: string }> }) => {
    const session = await requireAdmin(_request);
    const { uid } = await params;
    const payload = adminRoleSchema.parse(await readJson(_request));

    const role = await setAdminRole(payload.email ?? uid, payload.isAdmin, `admin:${session.uid}`);
    return json({ ok: true, role });
  }
);