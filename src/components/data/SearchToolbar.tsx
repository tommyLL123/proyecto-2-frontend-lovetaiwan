import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface SearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  filters?: ReactNode;
  placeholder?: string;
}

export function SearchToolbar({ value, onChange, filters, placeholder }: SearchToolbarProps) {
  return (
    <div className="toolbar">
      <label className="search-box">
        <Search size={18} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? 'Buscar por nombre o descripcion'}
        />
      </label>
      {filters && <div className="toolbar-filters">{filters}</div>}
    </div>
  );
}
