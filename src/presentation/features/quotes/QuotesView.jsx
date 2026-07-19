import { useState } from "react";
import { PRODUCTION_TYPE } from "../../../domain/production/productionTypes.js";
import { Tabs, ViewIntro } from "../workspace/WorkspaceUi.jsx";
import { QuoteConfigurator } from "./QuoteConfigurator.jsx";

export function QuotesView({ onNavigate }) {
  const [productionType, setProductionType] = useState(PRODUCTION_TYPE.REEL);

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Cotizaciones"
        title="Diseña tu producción"
        copy="Configura los recursos. Los mínimos se ajustan automáticamente según el proyecto."
      />
      <Tabs
        label="Tipo de producción"
        value={productionType}
        onChange={setProductionType}
        items={[
          [PRODUCTION_TYPE.REEL, "Reel"],
          [PRODUCTION_TYPE.SPOT, "Spot publicitario"],
          [PRODUCTION_TYPE.CINEMA, "Producción cine"],
        ]}
      />
      {productionType === PRODUCTION_TYPE.CINEMA ? (
        <CinemaContact />
      ) : (
        <QuoteConfigurator
          key={productionType}
          type={productionType}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

function CinemaContact() {
  return (
    <section className="cinema-contact">
      <span className="config-kicker">Producción cine</span>
      <h2>Conversemos sobre tu proyecto.</h2>
      <p>Las producciones cinematográficas requieren una propuesta diseñada a medida.</p>
      <div>
        <button className="primary-action" type="button">Contacto directo</button>
        <button className="secondary-action" type="button">Enviar referencias al celular</button>
      </div>
    </section>
  );
}
