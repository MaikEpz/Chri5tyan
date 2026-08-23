import { useId, useState } from "react";
import { classNames } from "./classNames.js";

export function CollapsibleFilters({
  activeCount = 0,
  children,
  className = "",
  contentClassName = "",
  defaultOpen = false,
  label = "Filtros",
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className={classNames("overflow-hidden rounded-xl border border-white/10 bg-white/3", className)}>
      <button
        className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-semibold text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
        type="button"
        aria-controls={contentId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg className="size-4 text-white/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M10 14v6" strokeLinecap="round" />
        </svg>
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-white px-1.5 py-0.5 text-[0.65rem] font-bold text-black" aria-label={`${activeCount} activos`}>
            {activeCount}
          </span>
        )}
        <span className="ml-auto text-xs font-medium text-white/40">
          {open ? "Ocultar" : "Mostrar"}
        </span>
        <svg className={classNames("size-4 text-white/45 transition-transform duration-300", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="m7 9 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        id={contentId}
        className={classNames(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <div className="overflow-hidden">
          <div className={classNames("border-t border-white/10", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
