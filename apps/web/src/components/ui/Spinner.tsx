export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
