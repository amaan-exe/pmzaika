import type { NextRequest } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

import { requireAdmin } from '@/lib/auth/admin';
import { apiError, json, withErrorHandling } from '@/lib/http/api';
import { COLLECTIONS, getDb } from '@/lib/db';

export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return apiError('No image file provided', 400);
  }

  if (file.size > 15 * 1024 * 1024) {
    return apiError('Image exceeds the maximum allowed size of 15MB', 400);
  }

  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return apiError('Unsupported image type. Please upload a JPG, PNG, WEBP, or AVIF image.', 400);
  }

  // Generate clean, safe identifier
  const cleanOriginalName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);

  const docId = `dish_${cleanOriginalName || 'photo'}_${Date.now()}`;
  const filename = `${docId}.webp`;

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Optimize and compress to webp: max 1200px width/height, 80% quality
  const webpBuffer = await sharp(inputBuffer)
    .resize({
      width: 1200,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  // Store in database so image persistence works reliably on serverless (Vercel)
  const db = await getDb();
  await db.collection<any>(COLLECTIONS.uploads).set(docId, {
    id: docId,
    filename,
    contentType: 'image/webp',
    data: webpBuffer.toString('base64'),
    size: webpBuffer.length,
    originalName: file.name,
    createdAt: new Date().toISOString(),
  });

  // Best-effort local file cache (succeeds locally, silently ignored on Vercel read-only filesystem)
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'assets', 'images', 'dishes');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), webpBuffer);
  } catch {
    // Expected on serverless / read-only filesystem
  }

  const publicUrl = `/api/uploads/${filename}`;

  return json({
    ok: true,
    url: publicUrl,
    filename,
    size: webpBuffer.length,
  });
});

