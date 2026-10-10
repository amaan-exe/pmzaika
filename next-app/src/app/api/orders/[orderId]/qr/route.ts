import QRCode from 'qrcode';
import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin';
import { findOrderAnywhere, getOrderForCustomer, OrderError } from '@/lib/orders/service';

export const runtime = 'nodejs';

/**
 * Renders the UPI payment QR for an order as an SVG image.
 *
 * Access matches the order endpoint: a valid tracking token for the customer, or
 * an admin session for staff printing a bill. Errors are returned as JSON rather
 * than thrown, because an `<img src>` cannot read an error body.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const token = request.nextUrl.searchParams.get('token') ?? '';

  try {
    let order = null;

    try {
      await requireAdmin(request);
      order = await findOrderAnywhere(orderId);
    } catch {
      // Not staff – fall through to the customer's tracking token.
    }

    if (!order) {
      order = await getOrderForCustomer(orderId, token);
    }

    const svg = await QRCode.toString(order.upi.intent, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: { dark: '#141414', light: '#ffffff' },
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    const status = error instanceof OrderError ? error.status : 500;
    return new Response(
      error instanceof OrderError ? error.message : 'Could not render payment QR',
      { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
}