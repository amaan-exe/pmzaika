/**
 * Thin browser-side wrapper around the JSON API.
 *
 * Keeps `fetch` usage and error normalisation in one place so components can
 * just `await` a call and handle `ApiError`.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    ...(init.json !== undefined ? { body: JSON.stringify(init.json) } : {}),
    cache: 'no-store',
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const data = (payload ?? {}) as { error?: string; fields?: Record<string, string> };
    throw new ApiError(
      data.error ?? `Request failed (${response.status})`,
      response.status,
      data.fields
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown, headers?: HeadersInit) =>
    request<T>(path, { method: 'POST', json, headers }),
  put: <T>(path: string, json?: unknown) => request<T>(path, { method: 'PUT', json }),
  patch: <T>(path: string, json?: unknown) => request<T>(path, { method: 'PATCH', json }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Session storage key holding the tracking token issued at checkout. */
export const TRACKING_KEY = 'pm_zaika_tracking';

export interface StoredTracking {
  orderId: string;
  token: string;
}

export function rememberTracking(entry: StoredTracking): void {
  try {
    const existing = readTrackingHistory();
    const next = [entry, ...existing.filter((item) => item.orderId !== entry.orderId)].slice(
      0,
      10
    );
    sessionStorage.setItem(TRACKING_KEY, JSON.stringify(next));
  } catch {
    // Private browsing – the tracking link still works via the emailed/WhatsApp URL.
  }
}

export function readTrackingHistory(): StoredTracking[] {
  try {
    const raw = sessionStorage.getItem(TRACKING_KEY);
    return raw ? (JSON.parse(raw) as StoredTracking[]) : [];
  } catch {
    return [];
  }
}

export function findTracking(orderId: string): StoredTracking | undefined {
  return readTrackingHistory().find((entry) => entry.orderId === orderId);
}