import { classNames } from "./classNames.js";

const TONES = Object.freeze({
  neutral: "bg-white/4 text-chris-muted",
  danger: "border border-red-400/30 bg-red-400/5 text-chris-danger",
  success: "border border-lime-300/20 bg-lime-300/5 text-lime-100",
  warning: "border border-amber-300/20 bg-amber-300/5 text-amber-100",
});

export function Notice({ children, className = "", role = "status", tone = "neutral" }) {
  return (
    <div
      className={classNames(
        "rounded-xl px-4 py-3 text-sm leading-relaxed",
        TONES[tone] || TONES.neutral,
        className,
      )}
      role={role}
    >
      {children}
    </div>
  );
}
