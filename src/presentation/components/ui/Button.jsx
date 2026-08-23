import { classNames } from "./classNames.js";

const VARIANTS = Object.freeze({
  primary: "border-white bg-white text-black hover:bg-neutral-200 focus-visible:outline-white",
  secondary: "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 focus-visible:outline-white",
  ghost: "border-transparent bg-transparent text-white/70 hover:bg-white/5 hover:text-white focus-visible:outline-white",
  danger: "border-red-400/25 bg-red-400/10 text-red-200 hover:border-red-300/45 hover:bg-red-400/20 focus-visible:outline-red-300",
});

const SIZES = Object.freeze({
  normal: "min-h-11 px-5 py-2.5",
  compact: "min-h-9 px-3.5 py-2 text-sm",
  icon: "size-10 rounded-full p-0",
});

export function Button({
  children,
  className = "",
  size = "normal",
  variant = "primary",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={classNames(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.normal,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
