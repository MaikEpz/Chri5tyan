export function CheckboxField({ children, ...props }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-white/70">
      <input
        className="size-4 accent-chris-accent"
        type="checkbox"
        {...props}
      />
      {children}
    </label>
  );
}
