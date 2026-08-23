import { Button } from "../ui/Button.jsx";
import { classNames } from "../ui/classNames.js";

export function RegistrationForm({ children, submitLabel, onSubmit, busy = false, message = "", error = "" }) {
  return <form className="grid grid-cols-1 gap-5 rounded-chris-card bg-white/2 p-[clamp(1rem,3vw,2rem)] min-[901px]:grid-cols-2" onSubmit={onSubmit}>{children}{(message || error) && <div className={classNames("col-span-full mt-1 rounded-xl p-4 text-sm", error ? "border border-red-400/30 bg-red-400/5 text-chris-danger" : "bg-white/4 text-chris-muted")} role={error ? "alert" : "status"}>{error || message}</div>}<Button className="justify-self-start" type="submit" disabled={busy}>{busy ? "Enviando…" : submitLabel}</Button></form>;
}
