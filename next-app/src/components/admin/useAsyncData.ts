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
 */
export function usePolling(reload: () => void, intervalMs: number): void {
  const reloadRef = useRef(reload);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    const timer = setInterval(() => reloadRef.current(), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}