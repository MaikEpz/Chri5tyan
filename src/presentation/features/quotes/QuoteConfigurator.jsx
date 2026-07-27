import { useLayoutEffect, useRef, useState } from "react";
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

export function QuoteConfigurator({
  exportProductionQuoteUseCase,
  type,
  onNavigate,
}) {
  const {
    quote,
    production,
    pricing,
    minimumHours,
    hasAssistant,
    setQuantity,
    setOption,
    toggleExtra,
  } = useProductionQuote(type);

  return (
    <div className="quote-layout">
      <div className="quote-configuration">
        <section className="config-card config-heading">
          <div><span className="config-kicker">Producción</span><h2>{production.name}</h2></div>
          <span className="format-badge">
            {production.format} · Base {formatUsd(production.basePrice)}
          </span>
        </section>
        <QuoteStudioPreview
          quote={quote}
          production={production}
          total={pricing.total}
        />
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
            <label className="select-field">
              <span>Fotografías</span>
              <select
                value={quote.photos}
                onChange={(event) => setOption("photos", event.target.value)}
              >
                {PHOTO_PACKAGES.map((option) => {
                  const price = production.prices.photos[option];
                  return (
                    <option key={option} value={option}>
                      {option}{price > 0 ? ` · +${formatUsd(price)}` : " · Incluido"}
                    </option>
                  );
                })}
              </select>
            </label>
          </ConfigSection>

          <ConfigSection title="Talento y espacios" index="04">
            <QuantityControl
              label="Personas de casting"
              value={quote.casting}
              minimum={0}
              maximum={production.maximumCasting}
              priceHint={additionalPrice(production.prices.castingPerson, "c/u")}
              onChange={(value) => setQuantity("casting", value)}
            />
            <div className="linked-actions">
              <button type="button" onClick={() => onNavigate("casting")}>Ver base de casting →</button>
              <button type="button" onClick={() => onNavigate("locations")}>Buscar locaciones →</button>
            </div>
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
        <SummaryRow label="Casting" value={quote.casting || "Sin casting"} />
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
