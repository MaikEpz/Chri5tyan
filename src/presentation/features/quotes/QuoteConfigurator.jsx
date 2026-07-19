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
import { useProductionQuote } from "./useProductionQuote.js";

const AVAILABLE_EXTRAS = Object.freeze(Object.values(QUOTE_EXTRA));

export function QuoteConfigurator({ type, onNavigate }) {
  const {
    quote,
    production,
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
          <span className="format-badge">{production.format}</span>
        </section>
        <div className="config-grid">
          <ConfigSection title="Equipo técnico" index="01">
            <QuantityControl
              label="Cámaras"
              value={quote.cameras}
              minimum={production.minimumCameras}
              onChange={(value) => setQuantity("cameras", value)}
            />
            <QuantityControl
              label="Luces"
              value={quote.lights}
              minimum={production.minimumLights}
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
              onChange={(value) => setQuantity("hours", value)}
            />
            <ToggleControl
              label="Maquillaje"
              checked={quote.makeup}
              onChange={(value) => setOption("makeup", value)}
            />
            <ToggleControl
              label="Sonido profesional"
              hint="Sonido incluido"
              checked={quote.professionalSound}
              onChange={(value) => setOption("professionalSound", value)}
            />
          </ConfigSection>

          <ConfigSection title="Entrega" index="03">
            <QuantityControl
              label="Videos"
              value={quote.videos}
              minimum={1}
              onChange={(value) => setQuantity("videos", value)}
            />
            <p className="config-note">
              Cada video adicional suma {production.hoursPerExtraVideo} {production.hoursPerExtraVideo === 1 ? "hora" : "horas"} de producción.
            </p>
            <label className="select-field">
              <span>Fotografías</span>
              <select
                value={quote.photos}
                onChange={(event) => setOption("photos", event.target.value)}
              >
                {PHOTO_PACKAGES.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </ConfigSection>

          <ConfigSection title="Talento y espacios" index="04">
            <QuantityControl
              label="Personas de casting"
              value={quote.casting}
              minimum={0}
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
              </button>
            ))}
          </div>
        </section>
      </div>

      <QuoteSummary quote={quote} production={production} />
    </div>
  );
}

function QuoteSummary({ quote, production }) {
  return (
    <aside className="quote-summary">
      <span className="config-kicker">Resumen</span>
      <h2>{production.name}</h2>
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
      <button className="primary-action" type="button">Continuar cotización</button>
      <small>El valor se calculará cuando se definan las tarifas.</small>
    </aside>
  );
}
