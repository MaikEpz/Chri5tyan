import { TextField } from "../ui/TextField.jsx";

export function AdminTextInput({ label, onChange, ...props }) {
  return <TextField label={label} required {...props} onChange={(event) => onChange(event.target.value)} />;
}
