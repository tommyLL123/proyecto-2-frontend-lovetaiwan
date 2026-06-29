export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/**
 * El backend no pagina (devuelve arrays completos), asi que paginamos y
 * filtramos del lado del cliente. `page` es 1-indexado para que combine
 * directamente con los controles de Pagination.tsx y los query params de la URL.
 */
export function paginate<T>(items: T[], page: number, size: number): PageResult<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, size);
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize));
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * safeSize;
  const content = items.slice(start, start + safeSize);
  return { content, totalElements, totalPages, page: clampedPage, size: safeSize };
}

export function filterBySearch<T>(items: T[], search: string, getFields: (item: T) => Array<string | undefined>): T[] {
  const term = search.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) =>
    getFields(item).some((field) => field?.toLowerCase().includes(term))
  );
}
