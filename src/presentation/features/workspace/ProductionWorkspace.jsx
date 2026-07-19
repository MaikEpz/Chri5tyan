import { useState } from "react";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import chrisLogoUrl from "../../../assets/branding/chris-logo.svg";
import { CastingView } from "../casting/CastingView.jsx";
import { EquipmentView } from "../equipment/EquipmentView.jsx";
import { LocationsView } from "../locations/LocationsView.jsx";
import { QuotesView } from "../quotes/QuotesView.jsx";

const WORKSPACE_SECTIONS = Object.freeze([
  { id: "quotes", label: "Cotizaciones" },
  { id: "casting", label: "Casting" },
  { id: "locations", label: "Locaciones" },
  { id: "equipment", label: "Equipos" },
]);

export function ProductionWorkspace({ onBack }) {
  const [activeSection, setActiveSection] = useState(WORKSPACE_SECTIONS[0].id);

  return (
    <div className="production-workspace">
      <header className="workspace-header">
        <button className="workspace-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          <span>Volver</span>
        </button>
        <span className="workspace-brand" aria-label="Chris">
          <img src={chrisLogoUrl} alt="" aria-hidden="true" />
        </span>
        <nav className="workspace-navigation" aria-label="Navegación principal">
          {WORKSPACE_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              data-active={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="workspace-main">
        {activeSection === "quotes" && <QuotesView onNavigate={setActiveSection} />}
        {activeSection === "casting" && <CastingView />}
        {activeSection === "locations" && <LocationsView />}
        {activeSection === "equipment" && <EquipmentView />}
      </main>
    </div>
  );
}
