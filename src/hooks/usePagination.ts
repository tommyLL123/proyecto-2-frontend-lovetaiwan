import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function usePagination(defaultSize = 10) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const size = Number(searchParams.get('size') ?? String(defaultSize));
  const search = searchParams.get('search') ?? '';

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(Math.max(1, nextPage)));
    setSearchParams(params);
  };

  const setSize = (nextSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('size', String(nextSize));
    params.set('page', '1');
    setSearchParams(params);
  };

  const setSearch = (nextSearch: string) => {
    const params = new URLSearchParams(searchParams);
    if (nextSearch) params.set('search', nextSearch);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  return useMemo(() => ({ page, size, search, setPage, setSize, setSearch }), [page, size, search, searchParams]);
}
