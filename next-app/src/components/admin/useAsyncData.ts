'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Shared data-fetching hook for the admin desks.
 *
 * The setState calls live inside `.then()` / `.catch()` / `.finally()` callbacks,
 * never in the effect body itself, so the React Compiler's
 * `set-state-in-effect` rule stays happy. This is the one pattern every admin
 * page should use instead of hand-rolling a `load` callback.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Always call the latest loader without re-running the effect. Assigned in an
  // effect because writing a ref during render is not allowed.
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    let alive = true;

    loaderRef.current()
      .then((value) => {
        if (alive) {
          setData(value);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // `deps` is spread so the effect re-runs when any dependency changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, reload };
}

/**
 * Polls `reload` on an interval. Used by the orders desk and menu desk so the
 * kitchen sees new orders without hitting refresh.
 *
 * When `pollInBackground` is enabled, an unthrottled Web Worker timer is used
 * so background tabs and separate desktop windows continue to openly search for
 * incoming orders without browser throttling.
 */
export function usePolling(
  reload: () => void,
  intervalMs: number,
  options?: { pollInBackground?: boolean }
): void {
  const reloadRef = useRef(reload);
  const pollInBackground = options?.pollInBackground ?? false;

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    let cleanupWorker: (() => void) | null = null;
    let timer: NodeJS.Timeout | null = null;

    // In modern browsers, timers in background tabs or un-focused windows
    // are throttled down to 60s or paused. An inline Web Worker runs on an
    // independent background OS thread and cannot be throttled by tab visibility!
    if (pollInBackground && typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const workerCode = `
          let t = null;
          self.onmessage = function(e) {
            if (e.data === 'start') {
              if (t) clearInterval(t);
              t = setInterval(function() {
                self.postMessage('tick');
              }, ${intervalMs});
            } else if (e.data === 'stop') {
              if (t) clearInterval(t);
              t = null;
            }
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        worker.onmessage = (e) => {
          if (e.data === 'tick') {
            reloadRef.current();
          }
        };

        worker.postMessage('start');

        cleanupWorker = () => {
          worker.postMessage('stop');
          worker.terminate();
          URL.revokeObjectURL(url);
        };
      } catch {
        // Fallback to standard timer if worker creation is blocked
      }
    }

    if (!cleanupWorker) {
      timer = setInterval(() => {
        // If not configured to poll in background, respect tab visibility
        if (!pollInBackground && typeof document !== 'undefined' && document.hidden) {
          return;
        }
        reloadRef.current();
      }, intervalMs);
    }

    // Refresh immediately when returning to the tab
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        reloadRef.current();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      if (cleanupWorker) cleanupWorker();
      if (timer) clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [intervalMs, pollInBackground]);
}