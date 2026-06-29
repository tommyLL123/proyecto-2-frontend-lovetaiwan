import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}

export function Pagination({ page, size, total, totalPages, onPage, onSize }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(total, page * size);
  const windowStart = Math.max(1, Math.min(totalPages - 4, page - 2));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => windowStart + index).filter(
    (value, index, arr) => value >= 1 && value <= totalPages && arr.indexOf(value) === index
  );

  return (
    <div className="pagination">
      <span>
        Mostrando {start}-{end} de {total}
      </span>
      <select value={size} onChange={(event) => onSize(Number(event.target.value))} aria-label="Tamano de pagina">
        {[10, 25, 50, 100].map((option) => (
          <option key={option} value={option}>
            {option} / pagina
          </option>
        ))}
      </select>
      <button className="icon-button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Pagina anterior">
        <ChevronLeft size={18} />
      </button>
      {pages.map((item) => (
        <button className={`page-number ${item === page ? 'active' : ''}`} key={item} onClick={() => onPage(item)}>
          {item}
        </button>
      ))}
      <button className="icon-button" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Pagina siguiente">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
