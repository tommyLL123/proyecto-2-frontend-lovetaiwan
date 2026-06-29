import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="state">
      <SearchX size={36} />
      <strong>{title}</strong>
      {action}
    </div>
  );
}
