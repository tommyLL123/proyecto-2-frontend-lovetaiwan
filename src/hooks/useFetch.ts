import { useCallback, useEffect, useState } from 'react';
import { getFriendlyError } from '../utils/errors';

export function useFetch<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // El array `deps` es dinamico por diseño (cada pantalla decide de que depende su carga),
  // por eso eslint no puede verificarlo estaticamente aqui.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    loader(controller.signal)
      .then(setData)
      .catch((err) => {
        if (!controller.signal.aborted) setError(getFriendlyError(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, deps);

  useEffect(() => run(), [run]);

  return { data, loading, error, refetch: run };
}
