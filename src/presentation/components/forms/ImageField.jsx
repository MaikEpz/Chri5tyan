import { useEffect, useId, useMemo } from "react";
import { AsyncImage } from "../ui/AsyncImage.jsx";

function imageFileKey(file) {
  return [file.name, file.size, file.type, file.lastModified].join(":");
}

export function ImageField({ label, hint, name = "images", files = [], onFilesChange, maxFiles = 5 }) {
  const inputId = useId();
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);
  const addFiles = (event) => {
    const knownFiles = new Set(files.map(imageFileKey));
    const nextFiles = [...files];
    Array.from(event.target.files || []).forEach((file) => {
      const key = imageFileKey(file);
      if (nextFiles.length < maxFiles && !knownFiles.has(key)) {
        knownFiles.add(key);
        nextFiles.push(file);
      }
    });
    if (nextFiles.length !== files.length) onFilesChange?.(nextFiles);
    event.target.value = "";
  };
  return <div className="relative grid gap-2"><span className="flex justify-between gap-4 text-sm text-chris-muted">{label}<small className="text-right text-chris-subtle">{hint}</small></span><input id={inputId} className="peer sr-only" type="file" accept="image/*" multiple name={name} onChange={addFiles} /><label className="flex min-h-13 cursor-pointer items-center rounded-xl border border-dashed border-white/20 px-3.5 py-3 text-sm font-medium transition-colors hover:border-white/40 hover:bg-white/4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-chris-accent" htmlFor={inputId}><strong>{files.length ? `${files.length} archivo${files.length > 1 ? "s" : ""}` : "Seleccionar imágenes"}</strong></label>{previews.length > 0 && <div className="file-preview-grid" aria-label="Imágenes seleccionadas">{previews.map(({ file, url }) => <figure className="file-preview" key={imageFileKey(file)}><AsyncImage wrapperClassName="aspect-[4/3]" className="h-full w-full object-cover" src={url} alt={`Previsualización de ${file.name}`} /><figcaption title={file.name}>{file.name}</figcaption><button type="button" aria-label={`Eliminar ${file.name}`} onClick={() => onFilesChange?.(files.filter((item) => item !== file))}><span aria-hidden="true">×</span></button></figure>)}</div>}</div>;
}
