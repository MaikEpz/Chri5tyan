import { classNames } from "../ui/classNames.js";

const CONTROL_CLASS = "min-h-13 w-full rounded-xl border border-white/15 bg-chris-surface px-3.5 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export function FormField({ label, type = "text", placeholder, options, wide = false, name, required = false, min, max, step, textarea = false, defaultValue, value, onChange, disabled = false }) {
  const shared = { defaultValue: value !== undefined ? undefined : defaultValue, disabled, name, onChange, placeholder, required, value };
  return <label className={classNames("grid gap-2", wide && "col-span-full")}><span className="flex justify-between gap-4 text-sm text-chris-muted">{label}</span>{textarea ? <textarea className={`${CONTROL_CLASS} min-h-28 resize-y`} {...shared} /> : options ? <select className={CONTROL_CLASS} {...shared}>{options.map((option) => { const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option]; return <option key={optionValue} value={optionValue}>{optionLabel}</option>; })}</select> : <input className={CONTROL_CLASS} max={max} min={min} step={step} type={type} {...shared} />}</label>;
}
