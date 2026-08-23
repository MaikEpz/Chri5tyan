export function EmptyState({ icon = "⌕", message, className = "" }) {
  return (
    <div className={`grid min-h-56 place-items-center gap-3 rounded-chris-card bg-white/2 p-8 text-center text-chris-muted ${className}`.trim()}>
      <span className="text-3xl text-white/35" aria-hidden="true">{icon}</span>
      <p className="m-0 max-w-md text-sm leading-relaxed">{message}</p>
    </div>
  );
}
