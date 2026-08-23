import { classNames } from "./classNames.js";

export function TextField({
  className = "",
  hint,
  label,
  multiline = false,
  ...props
}) {
  const controlClass = "min-h-12 w-full rounded-xl border border-white/15 bg-chris-surface px-3.5 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50";
  const Control = multiline ? "textarea" : "input";

  return (
    <label className={classNames("grid gap-1.5 text-xs text-white/60", className)}>
      <span>
        {label}
        {hint && <small className="ml-1 text-white/35">{hint}</small>}
      </span>
      <Control className={classNames(controlClass, multiline && "min-h-32 resize-y")} {...props} />
    </label>
  );
}
