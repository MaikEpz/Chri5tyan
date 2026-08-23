import { useMemo } from "react";
import { getCatalogImage } from "./catalogImages.js";
import { ImageCarousel } from "./ImageCarousel.jsx";

export function CatalogCard({ record }) {
  const images = useMemo(() => {
    if (record.images?.length) {
      if (record.isSample && record.images.length === 1) {
        const itemUrl = record.images[0].url || record.images[0];
        return Array(5).fill(null).map((_, index) => ({ id: `${record.id}-${index}`, url: itemUrl }));
      }
      return record.images;
    }
    const fallback = record.imageUrl || getCatalogImage(record.imageId);
    return fallback ? Array(5).fill(null).map((_, index) => ({ id: `${record.id || "sample"}-${index}`, url: fallback })) : [];
  }, [record]);
  const compactDetails = record.cardDetails ?? record.details?.slice(0, 2) ?? [];
  const summary = record.summary || (record.cardDetails == null ? record.details?.[2] : "");
  return (
    <article className="group grid min-w-0 overflow-hidden rounded-chris-card bg-white/3 p-3 transition-colors duration-300 hover:bg-white/6">
      <ImageCarousel images={images} alt={`${record.name}, ${record.specialty}`} />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-white/7 text-xs font-bold text-white" aria-hidden="true">{record.initials}</div><div className="min-w-0"><span className="block truncate text-[0.68rem] text-white/45" title={record.specialty}>{record.specialty}</span><h2 className="m-0 truncate text-base font-semibold text-white" title={record.name}>{record.name}</h2></div>{record.isSample && <small className="rounded-full bg-white/7 px-2 py-1 text-[0.62rem] text-white/45">Ejemplo</small>}</div>
      {summary && <p className="mt-3 mb-0 line-clamp-2 text-xs leading-relaxed text-white/48" title={summary}>{summary}</p>}
      {compactDetails.length > 0 && <ul className="my-3 flex min-w-0 list-none flex-wrap gap-1.5 p-0">{compactDetails.map((detail) => <li className="max-w-full truncate rounded-full bg-white/6 px-2.5 py-1.5 text-[0.68rem] text-white/55" title={detail} key={detail}>{detail}</li>)}</ul>}
      <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pt-3"><p className="m-0 grid min-w-0 gap-1 text-xs text-white/65"><span className="text-[0.62rem] tracking-wide text-white/35 uppercase">Disponibilidad</span><span className="line-clamp-2" title={record.availability}>{record.availability}</span></p><strong className="line-clamp-2 max-w-36 text-right text-xs leading-relaxed text-white" title={record.budget}>{record.budget}</strong></div>
    </article>
  );
}
