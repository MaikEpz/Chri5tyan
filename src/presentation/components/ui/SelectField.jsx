import { classNames } from "./classNames.js";

export function SelectField({ children, className = "", label, ...props }) {
  return (
    <label className={classNames("grid gap-1.5 text-xs text-white/60", className)}>
      <span>{label}</span>
      <select
        className="min-h-12 w-full rounded-xl border border-white/15 bg-chris-surface px-3.5 py-3 text-white outline-none transition-colors focus:border-white/35 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
