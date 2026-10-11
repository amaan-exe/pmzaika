import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import path from 'node:path';

import { COLLECTIONS, getDb, type Doc } from '@/lib/db';

export const runtime = 'nodejs';

interface UploadDoc extends Doc {
  filename: string;
  contentType: string;
  data: string; // base64
  size: number;
  originalName?: string;
  createdAt: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }

  // Sanitize filename to prevent directory traversal
  const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeFilename) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const docId = safeFilename.replace(/\.[^/.]+$/, '');

  try {
    const db = await getDb();
    const uploadsCol = db.collection<UploadDoc>(COLLECTIONS.uploads);

    // 1. Try finding by docId
    let doc = await uploadsCol.get(docId);

    // 2. Fallback search by filename
    if (!doc) {
      doc = await uploadsCol.findOne('filename', safeFilename);
    }

    if (doc?.data) {
      const buffer = Buffer.from(doc.data, 'base64');
      const contentType = doc.contentType || 'image/webp';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(buffer.byteLength),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  } catch (err) {
    console.error('[GET /api/uploads] Error retrieving file:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
