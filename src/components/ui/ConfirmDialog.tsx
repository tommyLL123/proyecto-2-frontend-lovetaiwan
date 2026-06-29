import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ open, title, message, loading, onCancel, onConfirm }: { open: boolean; title: string; message: string; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <AlertTriangle className="modal-icon" />
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="button button-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="button button-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Eliminando' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}
