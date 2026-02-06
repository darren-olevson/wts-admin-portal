import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseApiFetchOptions {
  /** Skip the initial fetch on mount */
  skip?: boolean;
  /** Dependencies that trigger a refetch */
  deps?: unknown[];
}

/**
 * Custom hook for fetching data from the API with loading/error states.
 * Handles cleanup on unmount and prevents state updates on unmounted components.
 * 
 * @param fetchFn - Async function that returns the data
 * @param options - Optional configuration
 * @returns Object with data, loading, error states and refetch function
 * 
 * @example
 * const { data, loading, error, refetch } = useApiFetch(
 *   () => withdrawalsApi.list({ accountId }),
 *   { deps: [accountId] }
 * );
 */
export function useApiFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseApiFetchOptions = {}
): UseApiFetchResult<T> {
  const { skip = false, deps = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('API fetch error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [skip]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...deps]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Custom hook for fetching multiple API endpoints in parallel.
 * 
 * @example
 * const { data, loading, error } = useMultiApiFetch({
 *   user: () => usersApi.get(userId),
 *   withdrawals: () => withdrawalsApi.list({ accountId }),
 * });
 * // data.user, data.withdrawals available when loaded
 */
export function useMultiApiFetch<T extends Record<string, () => Promise<unknown>>>(
  fetchFns: T,
  options: UseApiFetchOptions = {}
): UseApiFetchResult<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  type ResultType = { [K in keyof T]: Awaited<ReturnType<T[K]>> };

  const combinedFetch = useCallback(async (): Promise<ResultType> => {
    const keys = Object.keys(fetchFns) as (keyof T)[];
    const promises = keys.map((key) => fetchFns[key]());
    const results = await Promise.all(promises);

    return keys.reduce((acc, key, index) => {
      acc[key] = results[index] as Awaited<ReturnType<T[typeof key]>>;
      return acc;
    }, {} as ResultType);
  }, [fetchFns]);

  return useApiFetch(combinedFetch, options);
}

export default useApiFetch;
