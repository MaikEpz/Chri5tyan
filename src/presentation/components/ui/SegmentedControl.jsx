import { classNames } from "./classNames.js";

export function SegmentedControl({ items, label, onChange, value }) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-full bg-white/6 p-1"
      role="tablist"
      aria-label={label}
    >
      {items.map(([itemValue, itemLabel]) => {
        const selected = itemValue === value;
        return (
          <button
            key={itemValue}
            type="button"
            role="tab"
            aria-selected={selected}
            className={classNames(
              "cursor-pointer rounded-full border-0 px-3 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              selected ? "bg-white text-black" : "bg-transparent text-white/55 hover:text-white",
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
