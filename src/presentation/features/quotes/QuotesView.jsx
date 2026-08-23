import { useState } from "react";
import { PRODUCTION_TYPE } from "../../../domain/production/productionTypes.js";
import { Tabs } from "../../components/layout/Tabs.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";
import { QuoteConfigurator } from "./QuoteConfigurator.jsx";

export function QuotesView({
  catalogService,
  createCinemaRequestUseCase,
  exportProductionQuoteUseCase,
  runProtected,
  user,
}) {
  const [productionType, setProductionType] = useState(PRODUCTION_TYPE.REEL);

  const intro = (
    <ViewIntro
      eyebrow="Cotizaciones"
      title="Diseña tu producción"
      copy="Configura los recursos. Los mínimos se ajustan automáticamente según el proyecto."
    />
  );

  const tabs = (
    <Tabs
      label="Tipo de producción"
      value={productionType}
      onChange={setProductionType}
      items={[
        [PRODUCTION_TYPE.REEL, "Reel vertical"],
        [PRODUCTION_TYPE.SPOT, "Spot horizontal"],
        [PRODUCTION_TYPE.CINEMA, "Producción cine"],
      ]}
    />
  );

  return (
    <div className="workspace-view quotes-workspace-view">
      {productionType === PRODUCTION_TYPE.CINEMA ? (
        <div className="cinema-layout">
          <aside className="cinema-intro-column">
            {tabs}
            {intro}
          </aside>
          <CinemaContact
            createCinemaRequestUseCase={createCinemaRequestUseCase}
            runProtected={runProtected}
            user={user}
          />
        </div>
      ) : (
        <QuoteConfigurator
          catalogService={catalogService}
          exportProductionQuoteUseCase={exportProductionQuoteUseCase}
          intro={intro}
          key={productionType}
          tabs={tabs}
          type={productionType}
        />
      )}
    </div>
  );
}

function CinemaContact({ createCinemaRequestUseCase, runProtected, user }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const request = {
      projectTitle: values.get("projectTitle"),
      description: values.get("description"),
      estimatedDate: values.get("estimatedDate") || null,
      referencesUrl: values.get("referencesUrl") || null,
      contactPhone: values.get("contactPhone"),
    };
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await runProtected(() => createCinemaRequestUseCase.execute(request));
      setMessage("Solicitud recibida. Nos pondremos en contacto contigo.");
      form.reset();
    } catch (submitError) {
      if (submitError?.code !== "AUTH_CANCELLED") {
        setError(submitError?.message || "No se pudo enviar la solicitud.");
      }
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="cinema-contact">
      <span className="config-kicker">Producción cine</span>
      <h2>Conversemos sobre tu proyecto.</h2>
      <p>Las producciones cinematográficas requieren una propuesta diseñada a medida.</p>
      <form className="cinema-request-form" onSubmit={handleSubmit}>
        <label>
          <span>Título del proyecto</span>
          <input name="projectTitle" required maxLength="160" />
        </label>
        <label>
          <span>Fecha estimada</span>
          <input name="estimatedDate" type="date" min={today} />
        </label>
        <label className="is-wide">
          <span>Descripción</span>
          <textarea name="description" required maxLength="5000" />
        </label>
        <label>
          <span>Enlace de referencias</span>
          <input name="referencesUrl" type="url" maxLength="500" />
        </label>
        <label>
          <span>Teléfono de contacto</span>
          <input
            key={user?.phone || "empty-phone"}
            defaultValue={user?.phone || ""}
            name="contactPhone"
            type="tel"
            required
          />
        </label>
        {(message || error) && (
          <p
            className={`form-feedback is-wide${error ? " is-error" : ""}`}
            role={error ? "alert" : "status"}
          >
            {error || message}
          </p>
        )}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>
    </section>
  );
}
