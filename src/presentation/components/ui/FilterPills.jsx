import { classNames } from "./classNames.js";

export function FilterPills({ items, label, onChange, value, className = "" }) {
  return (
    <div className={classNames("flex flex-wrap gap-2", className)} role="group" aria-label={label}>
      {items.map(([itemValue, itemLabel]) => {
        const selected = itemValue === value;
        return (
          <button
            key={itemValue || "all"}
            type="button"
            aria-pressed={selected}
            className={classNames(
              "cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              selected
                ? "border-white bg-white text-black"
                : "border-white/12 bg-white/4 text-white/60 hover:border-white/30 hover:text-white",
            )}
            onClick={() => onChange(itemValue)}
          >
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
}
