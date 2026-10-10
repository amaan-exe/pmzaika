import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { json, readJson, withErrorHandling } from '@/lib/http/api';
import { availabilityToggleSchema, menuItemSchema } from '@/lib/orders/schema';
import { deleteMenuItem, toggleAvailability, updateMenuItem } from '@/lib/menu/service';

export const runtime = 'nodejs';

/** Updates a dish's price, description, category, image or availability. */
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
    const session = await requireAdmin(request);
    const { itemId } = await params;
    const payload = menuItemSchema.partial().parse(await readJson(request));

    const item = await updateMenuItem(itemId, payload, `admin:${session.uid}`);
    return json({ ok: true, item });
  }
);

/** Fast in/out toggle used by the kitchen when a dish sells out. */
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
    await requireAdmin(request);
    const { itemId } = await params;
    availabilityToggleSchema.parse(await readJson(request));

    const item = await toggleAvailability(itemId);
    return json({ ok: true, item });
  }
);

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) => {
    await requireAdmin(request);
    const { itemId } = await params;

    await deleteMenuItem(itemId);
    return json({ ok: true });
  }
);