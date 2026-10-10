import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { AuthError } from '@/lib/auth/admin';
import { UserAuthError } from '@/lib/auth/user';
import { CouponError } from '@/lib/coupons/service';
import { MenuError } from '@/lib/menu/service';
import { ProfileError } from '@/lib/users/service';
import { OrderError } from '@/lib/orders/service';

/** Domain errors that map cleanly onto an HTTP status + JSON body. */
const KNOWN_ERRORS = [OrderError, AuthError, UserAuthError, MenuError, CouponError, ProfileError] as const;

/** Sensible ceiling for our JSON payloads; keeps memory use predictable. */
const MAX_BODY_BYTES = 64 * 1024;

export function json(data: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  const customHeaders = init?.headers ? new Headers(init.headers) : null;
  if (!customHeaders || !customHeaders.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  return response;
}

export function apiError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  return json({ ok: false, error: message, ...extra }, { status });
}

/**
 * Wraps a handler so every thrown error becomes a consistent JSON payload and
 * internal details are never leaked to the client.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      for (const ErrorType of KNOWN_ERRORS) {
        if (error instanceof ErrorType) {
          const fields = (error as { fields?: Record<string, string> }).fields;
          return apiError(error.message, (error as { status: number }).status, {
            ...(fields ? { fields } : {}),
          });
        }
      }

      if (error instanceof z.ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues) {
          fields[issue.path.join('.') || '_'] ??= issue.message;
        }
        return apiError('Please fix the highlighted fields', 422, { fields });
      }

      console.error('[pm-zaika] unhandled API error', error);
      return apiError('Something went wrong on our side. Please try again.', 500);
    }
  };
}

/** Reads and size-limits a JSON request body. */
export async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) {
    throw new OrderError('Request payload is too large', 413);
  }

  try {
    return await request.json();
  } catch {
    throw new OrderError('Request body must be valid JSON', 400);
  }
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Small in-memory fixed-window limiter. Protects the public order endpoint from
 * accidental double submits and trivial abuse on a single instance.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

// Keep the limiter map from growing without bound on long-running processes.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  timer.unref?.();
}