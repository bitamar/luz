import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseListStateOptions<TData> {
  fetcher: () => Promise<TData>;
  getEmpty?: (data: TData) => boolean;
  isNotFoundError?: (error: unknown) => boolean;
  formatError?: (error: unknown) => string | null;
}

export function useListState<TData>({
  fetcher,
  getEmpty,
  isNotFoundError,
  formatError,
}: UseListStateOptions<TData>) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetcherRef = useRef(fetcher);
  const getEmptyRef = useRef(getEmpty);
  const isNotFoundErrorRef = useRef(isNotFoundError);
  const formatErrorRef = useRef(formatError);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    getEmptyRef.current = getEmpty;
  }, [getEmpty]);

  useEffect(() => {
    isNotFoundErrorRef.current = isNotFoundError;
  }, [isNotFoundError]);

  useEffect(() => {
    formatErrorRef.current = formatError;
  }, [formatError]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      console.error('Failed to load data', err);
      const notFoundError =
        isNotFoundErrorRef.current?.(err) ?? (err instanceof Error && /404/.test(err.message));
      if (notFoundError) {
        setNotFound(true);
        setError(null);
      } else {
        const message = formatErrorRef.current?.(err) ?? 'אירעה שגיאה בטעינת הנתונים';
        setError(message);
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isEmpty = useMemo(() => {
    const derivedEmpty = getEmptyRef.current
      ? data !== null && getEmptyRef.current(data)
      : Array.isArray(data) && data.length === 0;

    return !loading && !error && !notFound && derivedEmpty;
  }, [data, error, loading, notFound]);

  return {
    data,
    setData,
    loading,
    error,
    notFound,
    refresh,
    isEmpty,
  };
}
