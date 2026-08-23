import { Dialog } from "../ui/Dialog.jsx";

export function AdminDialog({ title, children }) {
  return <Dialog className="max-w-4xl p-6" aria-label={title}><h2 className="mt-0 mb-5 text-2xl font-semibold">{title}</h2>{children}</Dialog>;
}
