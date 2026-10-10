import type { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';

import { requireAdmin } from '@/lib/auth/admin';
import { apiError, json, withErrorHandling } from '@/lib/http/api';

export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return apiError('No image file provided', 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return apiError('Image exceeds the maximum allowed size of 10MB', 400);
  }

  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return apiError('Unsupported image type. Please upload a JPG, PNG, WEBP, or AVIF image.', 400);
  }

  // Generate clean, safe filename
  const cleanOriginalName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);

  const extension = EXTENSION_MAP[mime] || '.jpg';
  const filename = `${cleanOriginalName || 'dish'}_${Date.now()}${extension}`;

  const uploadDir = path.join(process.cwd(), 'public', 'assets', 'images', 'dishes');
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const publicUrl = `/assets/images/dishes/${filename}`;

  return json({
    ok: true,
    url: publicUrl,
    filename,
    size: file.size,
  });
});
