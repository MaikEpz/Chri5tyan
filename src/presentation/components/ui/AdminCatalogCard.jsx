export function AdminCatalogCard({
  actions,
  active,
  children,
  description,
  eyebrow,
  meta,
  title,
}) {
  return (
    <article className="grid min-w-0 overflow-hidden rounded-chris-card bg-white/3 transition-colors hover:bg-white/5">
      {children}
      <div className="grid gap-2 p-4">
        <span className="text-xs text-white/45">{eyebrow}</span>
        <h2 className="m-0 text-xl font-semibold text-white">{title}</h2>
        {description && <p className="m-0 line-clamp-3 text-sm leading-relaxed text-chris-muted">{description}</p>}
        {meta && <small className="text-xs text-white/45">{meta}</small>}
        <strong className={active ? "text-xs text-lime-200" : "text-xs text-white/40"}>
          {active ? "Visible" : "Oculto"}
        </strong>
      </div>
      <footer className="mt-auto flex flex-wrap gap-2 px-4 pb-4 pt-2">
        {actions}
      </footer>
    </article>
  );
}
