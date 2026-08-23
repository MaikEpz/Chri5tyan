import { classNames } from "../ui/classNames.js";

export function Tabs({ value, onChange, items, label }) {
  return (
    <div className="workspace-tabs my-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/4 p-1 [scrollbar-width:none]" role="tablist" aria-label={label}>
      {items.map(([id, itemLabel]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} className={classNames("shrink-0 cursor-pointer rounded-full border-0 px-4 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white", value === id ? "bg-neutral-100 text-chris-background" : "bg-transparent text-white/55 hover:text-white")} onClick={() => onChange(id)}>{itemLabel}</button>
      ))}
    </div>
  );
}
