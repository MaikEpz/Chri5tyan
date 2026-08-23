import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AsyncImage } from "../ui/AsyncImage.jsx";

export function ImageCarousel({ images = [], alt = "", className = "" }) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [readyUrl, setReadyUrl] = useState("");
  const items = useMemo(() => {
    if (!images) return [];
    return (Array.isArray(images) ? images : [images]).map((item) => {
      if (typeof item === "string") return { url: item };
      if (item && typeof item === "object") return { url: item.url || item.src, ...item };
      return null;
    }).filter((item) => Boolean(item?.url));
  }, [images]);
  const current = items[index] || items[0];
  const hasMultiple = items.length > 1;
  const move = (event, direction) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    setIndex((currentIndex) => (currentIndex + direction + items.length) % items.length);
  };
  const select = (event, targetIndex) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    setIndex(targetIndex);
  };
  const openFullscreen = (event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    if (readyUrl !== current?.url) return;
    setIsOpen(true);
  };
  const closeFullscreen = (event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    setIsOpen(false);
  };

  useEffect(() => {
    setReadyUrl("");
  }, [current?.url]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
      else if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + items.length) % items.length);
      else if (event.key === "ArrowRight") setIndex((value) => (value + 1) % items.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, items.length]);

  if (!items.length) return null;
  const imageAlt = current.alt || (hasMultiple && alt ? `${alt} (Imagen ${index + 1} de ${items.length})` : alt || `Imagen ${index + 1} de ${items.length}`);
  const pagination = (fullscreen = false) => hasMultiple && (
    <div className={fullscreen ? "lightbox-pagination" : "carousel-pagination"} role="group" aria-label="Navegar entre imágenes">
      {items.map((item, itemIndex) => <button key={item.id || item.url || itemIndex} type="button" className={`carousel-dot${itemIndex === index ? " is-active" : ""}`} aria-label={`Ver foto ${itemIndex + 1} de ${items.length}`} onClick={(event) => select(event, itemIndex)} />)}
    </div>
  );

  return (
    <>
      <div className={`media-carousel ${className}`.trim()}>
        <AsyncImage className="media-carousel-image" src={current.url} alt={imageAlt} loading="lazy" decoding="async" onReady={() => setReadyUrl(current.url)} onClick={openFullscreen} title={readyUrl === current.url ? "Clic para ver en pantalla completa" : "Cargando imagen"} role="button" aria-disabled={readyUrl !== current.url} tabIndex={readyUrl === current.url ? 0 : -1} onKeyDown={(event) => event.key === "Enter" && openFullscreen(event)} />
        {hasMultiple && <><button type="button" className="carousel-btn carousel-btn-prev" aria-label="Imagen anterior" onClick={(event) => move(event, -1)}>‹</button><button type="button" className="carousel-btn carousel-btn-next" aria-label="Imagen siguiente" onClick={(event) => move(event, 1)}>›</button>{pagination()}</>}
      </div>
      {isOpen && createPortal(
        <div className="media-lightbox-overlay" role="dialog" aria-label="Visor de fotos en pantalla completa" aria-modal="true" onClick={closeFullscreen}>
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close-btn" aria-label="Cerrar pantalla completa" onClick={closeFullscreen}>×</button><span className="lightbox-counter">{index + 1} / {items.length}</span><div className="lightbox-stage"><AsyncImage wrapperClassName="lightbox-image-frame" className="lightbox-image" src={current.url} alt={imageAlt} /></div>
            {hasMultiple && <><button type="button" className="lightbox-btn lightbox-btn-prev" aria-label="Imagen anterior en pantalla completa" onClick={(event) => move(event, -1)}>‹</button><button type="button" className="lightbox-btn lightbox-btn-next" aria-label="Imagen siguiente en pantalla completa" onClick={(event) => move(event, 1)}>›</button>{pagination(true)}</>}
          </div>
        </div>, document.body,
      )}
    </>
  );
}
