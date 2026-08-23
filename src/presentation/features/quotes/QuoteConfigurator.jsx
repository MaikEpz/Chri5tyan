import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PHOTO_PACKAGES,
  QUOTE_EXTRA,
} from "../../../domain/production/productionQuote.js";
import {
  ConfigSection,
  QuantityControl,
  SummaryRow,
  ToggleControl,
} from "./QuoteControls.jsx";
import { QuoteStudioPreview } from "./QuoteStudioPreview.jsx";
import { QuoteResourceExplorer } from "./QuoteResourceExplorer.jsx";
import { useProductionQuote } from "./useProductionQuote.js";

const AVAILABLE_EXTRAS = Object.freeze(Object.values(QUOTE_EXTRA));
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatUsd(value) {
  return USD_FORMATTER.format(value);
}

function additionalPrice(value, suffix = "") {
  return `+${formatUsd(value)}${suffix ? ` ${suffix}` : ""}`;
}

function useQuoteStickyViewportEffects({ contentRef, isDesktop, visualRef }) {
  useLayoutEffect(() => {
    const visual = visualRef.current;
    const content = contentRef.current;
    if (!visual || !content) return undefined;

    const scrollContainer = visual.closest(".monitor-app");
    let animationFrame = 0;

    const updateClip = () => {
      animationFrame = 0;
      if (isDesktop) {
        content.style.removeProperty("--quote-mobile-clip-top");
        return;
      }

      const visualRect = visual.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const clipTop = Math.min(
        contentRect.height,
        Math.max(0, visualRect.bottom - contentRect.top),
      );
      content.style.setProperty("--quote-mobile-clip-top", `${clipTop}px`);
    };

    const scheduleClipUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateClip);
    };

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(scheduleClipUpdate);
    resizeObserver?.observe(visual);
    resizeObserver?.observe(content);
    scrollContainer?.addEventListener("scroll", scheduleClipUpdate, { passive: true });
    window.addEventListener("resize", scheduleClipUpdate);
    updateClip();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      scrollContainer?.removeEventListener("scroll", scheduleClipUpdate);
      window.removeEventListener("resize", scheduleClipUpdate);
      content.style.removeProperty("--quote-mobile-clip-top");
    };
  }, [contentRef, isDesktop, visualRef]);
}

function useDesktopQuoteVisualPortal(visualRef) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 900);
  const [portalTarget, setPortalTarget] = useState(null);
  const placeholderRef = useRef(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      const updateDesktopMode = () => setIsDesktop(window.innerWidth > 900);
      window.addEventListener("resize", updateDesktopMode);
      updateDesktopMode();
      return () => window.removeEventListener("resize", updateDesktopMode);
    }

    const mediaQuery = window.matchMedia("(min-width: 901px)");
    const updateDesktopMode = () => setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateDesktopMode);
    updateDesktopMode();
    return () => mediaQuery.removeEventListener("change", updateDesktopMode);
  }, []);

  useLayoutEffect(() => {
    setPortalTarget(
      isDesktop ? document.querySelector(".monitor-immersive-shell") : null,
    );
  }, [isDesktop]);

  useLayoutEffect(() => {
    if (!portalTarget) return undefined;
    const placeholder = placeholderRef.current;
    const visual = visualRef.current;
    if (!placeholder || !visual) return undefined;

    const updatePlacement = () => {
      const rect = placeholder.getBoundingClientRect();
      visual.style.setProperty("--quote-desktop-left", `${rect.left}px`);
      visual.style.setProperty("--quote-desktop-width", `${rect.width}px`);
    };

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updatePlacement);
    resizeObserver?.observe(placeholder);
    window.addEventListener("resize", updatePlacement);
    updatePlacement();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePlacement);
      visual.style.removeProperty("--quote-desktop-left");
      visual.style.removeProperty("--quote-desktop-width");
    };
  }, [portalTarget, visualRef]);

  return { isDesktop, placeholderRef, portalTarget };
}

export function QuoteConfigurator({
  catalogService,
  exportProductionQuoteUseCase,
  intro,
  type,
  tabs,
}) {
  const {
    quote,
    production,
    pricing,
    minimumHours,
    hasAssistant,
    setQuantity,
    setOption,
    setCastingSelections,
    setLocationSelection,
    toggleExtra,
  } = useProductionQuote(type);
  const [resourceExplorerTab, setResourceExplorerTab] = useState(null);
  const contentRef = useRef(null);
  const visualRef = useRef(null);
  const {
    isDesktop,
    placeholderRef,
    portalTarget,
  } = useDesktopQuoteVisualPortal(visualRef);
  useQuoteStickyViewportEffects({ contentRef, isDesktop, visualRef });

  const visualColumn = (
    <aside
      ref={visualRef}
      className={`quote-visual-column${portalTarget ? " is-desktop-portal" : ""}`}
    >
      {tabs}
      <QuoteStudioPreview
        quote={quote}
        production={production}
        total={pricing.total}
      />
    </aside>
  );

  return (
    <>
      <div className="quote-composer">
      {portalTarget
        ? <div ref={placeholderRef} className="quote-visual-placeholder" aria-hidden="true" />
        : visualColumn}
      <div ref={contentRef} className="quote-content-column">
        <div className="quote-content-intro">
          {intro}
        </div>
        <div className="quote-layout">
          <div className="quote-configuration">
        <section className="config-card config-heading">
          <div><span className="config-kicker">Producción</span><h2>{production.name}</h2></div>
          <span className="format-badge">
            {production.format} · Base {formatUsd(production.basePrice)}
          </span>
        </section>
        <div className="config-grid">
          <ConfigSection title="Equipo técnico" index="01">
            <QuantityControl
              label="Cámaras"
              value={quote.cameras}
              minimum={production.minimumCameras}
              maximum={production.maximumCameras}
              priceHint={additionalPrice(production.prices.additionalCamera, "c/u")}
              onChange={(value) => setQuantity("cameras", value)}
            />
            <QuantityControl
              label="Luces"
              value={quote.lights}
              minimum={production.minimumLights}
              maximum={production.maximumLights}
              priceHint={additionalPrice(production.prices.additionalLight, "c/u")}
              onChange={(value) => setQuantity("lights", value)}
            />
            <div className={`info-row${hasAssistant ? " is-active" : ""}`}>
              <span>{hasAssistant ? "✓" : "i"}</span>
              {hasAssistant ? "Gaffer / Asistente incluido" : "Gaffer desde 3 luces"}
            </div>
          </ConfigSection>

          <ConfigSection title="Producción" index="02">
            <QuantityControl
              label="Horas"
              value={quote.hours}
              minimum={minimumHours}
              priceHint={additionalPrice(production.prices.additionalHour, "c/u")}
              onChange={(value) => setQuantity("hours", value)}
            />
            <ToggleControl
              label="Maquillaje"
              hint={production.makeupByDefault
                ? "Incluido en el precio base"
                : additionalPrice(production.prices.makeup)}
              checked={quote.makeup}
              onChange={(value) => setOption("makeup", value)}
            />
            <ToggleControl
              label="Sonido profesional"
              hint={production.professionalSoundByDefault
                ? "Incluido en el precio base"
                : additionalPrice(production.prices.professionalSound)}
              checked={quote.professionalSound}
              onChange={(value) => setOption("professionalSound", value)}
            />
          </ConfigSection>

          <ConfigSection title="Entrega" index="03">
            <QuantityControl
              label="Videos"
              value={quote.videos}
              minimum={1}
              priceHint={additionalPrice(production.prices.additionalVideo, "c/u")}
              onChange={(value) => setQuantity("videos", value)}
            />
            <p className="config-note">
              Cada video adicional suma edición y {production.hoursPerExtraVideo} {production.hoursPerExtraVideo === 1 ? "hora" : "horas"} de producción.
            </p>
            <div className="select-field">
              <span>Fotografías</span>
              <PhotoPackageSelect
                options={PHOTO_PACKAGES}
                prices={production.prices.photos}
                value={quote.photos}
                onChange={(value) => setOption("photos", value)}
              />
            </div>
          </ConfigSection>

          <ConfigSection title="Talento y espacios" index="04">
            <QuoteResourceControl
              label="Casting"
              value={quote.castingSelections.length
                ? quote.castingSelections.map((item) => item.name).join(" · ")
                : "Explora y añade los perfiles que necesites"}
              meta={`${quote.castingSelections.length} ${quote.castingSelections.length === 1 ? "perfil" : "perfiles"}`}
              onClick={() => setResourceExplorerTab("casting")}
            />
            <QuoteResourceControl
              label="Locación"
              value={quote.locationSelection?.name || "Elige el espacio para la producción"}
              meta={quote.locationSelection
                ? `1 locación · ${formatUsd(quote.locationSelection.rate.value)} / hora`
                : "0 locaciones"}
              onClick={() => setResourceExplorerTab("locations")}
            />
          </ConfigSection>
        </div>

        <section className="config-card extras-card">
          <div><span className="config-kicker">05</span><h3>Extras</h3></div>
          <div className="option-chips">
            {AVAILABLE_EXTRAS.map((extra) => (
              <button
                key={extra}
                type="button"
                data-selected={quote.extras.includes(extra)}
                onClick={() => toggleExtra(extra)}
              >
                <span>{quote.extras.includes(extra) ? "✓" : "+"}</span>
                {extra}
                <small>+{formatUsd(production.prices.extras[extra])}</small>
              </button>
            ))}
          </div>
        </section>
          </div>

          <QuoteSummary
            exportProductionQuoteUseCase={exportProductionQuoteUseCase}
            quote={quote}
            production={production}
            pricing={pricing}
          />
        </div>
      </div>
      </div>
      {portalTarget && createPortal(visualColumn, portalTarget)}
      {resourceExplorerTab && (
        <QuoteResourceExplorer
          catalogService={catalogService}
          castingSelections={quote.castingSelections}
          initialTab={resourceExplorerTab}
          locationSelection={quote.locationSelection}
          onApply={({ castingSelections, locationSelection }) => {
            setCastingSelections(castingSelections);
            setLocationSelection(locationSelection);
            setResourceExplorerTab(null);
          }}
          onClose={() => setResourceExplorerTab(null)}
        />
      )}
    </>
  );
}

function QuoteResourceControl({ label, meta, onClick, value }) {
  return (
    <button
      className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-left transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      type="button"
      onClick={onClick}
    >
      <span className="min-w-0">
        <strong className="block text-sm font-medium text-white">{label}</strong>
        <small className="mt-1 block truncate text-white/40">{value}</small>
      </span>
      <span className="grid justify-items-end gap-1 text-xs text-white/45"><small>{meta}</small><i className="not-italic transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</i></span>
    </button>
  );
}

function PhotoPackageSelect({ options, prices, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const describePrice = (option) => (
    prices[option] > 0 ? `+${formatUsd(prices[option])}` : "Incluido"
  );

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div ref={rootRef} className="photo-package-select" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        className="photo-select-trigger"
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <small>{describePrice(value)}</small>
        <i aria-hidden="true" />
      </button>
      {open && (
        <div className="photo-select-menu" role="listbox" aria-label="Paquete de fotografías">
          {options.map((option) => (
            <button
              key={option}
              className="photo-select-option"
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <span>{option}</span>
              <small>{describePrice(option)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteSummary({
  exportProductionQuoteUseCase,
  quote,
  production,
  pricing,
}) {
  const summaryRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useLayoutEffect(() => {
    const summary = summaryRef.current;
    if (!summary) return undefined;

    const updateScale = () => {
      if (window.innerWidth <= 900) {
        summary.style.setProperty("--quote-summary-scale", "1");
        summary.style.removeProperty("--quote-summary-available-height");
        return;
      }

      const stickyTop = Number.parseFloat(window.getComputedStyle(summary).top) || 0;
      const availableHeight = window.innerHeight - stickyTop - 12;
      summary.style.setProperty(
        "--quote-summary-available-height",
        `${availableHeight}px`,
      );
      const naturalHeight = summary.offsetHeight;
      const scale = naturalHeight > 0
        ? Math.min(1, Math.max(0.68, availableHeight / naturalHeight))
        : 1;

      summary.style.setProperty("--quote-summary-scale", scale.toFixed(4));
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(summary);
    window.addEventListener("resize", updateScale);
    updateScale();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError("");
    try {
      await exportProductionQuoteUseCase.execute({ quote, production, pricing });
    } catch (error) {
      console.error("No se pudo generar la cotización en PDF.", error);
      setPdfError("No se pudo generar el PDF. Inténtalo nuevamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <aside ref={summaryRef} className="quote-summary">
      <span className="config-kicker">Resumen</span>
      <h2>{production.name}</h2>
      <div className="quote-total" aria-live="polite">
        <span>Total estimado</span>
        <strong>{formatUsd(pricing.total)}</strong>
        <small>USD</small>
      </div>
      <dl>
        <SummaryRow label="Formato" value={production.format} />
        <SummaryRow label="Cámaras" value={quote.cameras} />
        <SummaryRow label="Luces" value={quote.lights} />
        <SummaryRow label="Producción" value={`${quote.hours} h`} />
        <SummaryRow label="Entregas" value={`${quote.videos} video${quote.videos > 1 ? "s" : ""}`} />
        <SummaryRow label="Fotografía" value={quote.photos} />
        <SummaryRow label="Casting" value={quote.castingSelections.length || "Sin elegir"} />
        <SummaryRow label="Locación" value={quote.locationSelection ? `1 · ${quote.locationSelection.name}` : "Sin elegir"} />
      </dl>
      {quote.extras.length > 0 && (
        <div className="summary-extras">
          <span>Extras</span>
          <p>{quote.extras.join(" · ")}</p>
        </div>
      )}
      <div className="quote-breakdown">
        <div>
          <span>Paquete base</span>
          <strong>{formatUsd(pricing.basePrice)}</strong>
        </div>
        {pricing.additions.map((item) => (
          <div key={item.id}>
            <span>{item.label}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
            <strong>+{formatUsd(item.total)}</strong>
          </div>
        ))}
      </div>
      <button
        className="primary-action"
        type="button"
        aria-busy={isGeneratingPdf}
        disabled={isGeneratingPdf}
        onClick={handleDownloadPdf}
      >
        {isGeneratingPdf
          ? "Generando PDF…"
          : `Continuar · ${formatUsd(pricing.total)}`}
      </button>
      {pdfError && <small className="quote-pdf-error" role="alert">{pdfError}</small>}
      <small>Estimación interactiva en dólares estadounidenses. El valor final puede ajustarse según locación y requerimientos especiales.</small>
    </aside>
  );
}
