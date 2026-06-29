export function LoadingState({ label = 'Cargando', fullPage = false }: { label?: string; fullPage?: boolean }) {
  return (
    <div className={fullPage ? 'state state-full' : 'state'}>
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
