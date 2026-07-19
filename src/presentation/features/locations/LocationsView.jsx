import { useState } from "react";
import { SAMPLE_LOCATIONS } from "../../../domain/catalog/sampleRecords.js";
import {
  CatalogGrid,
  FormField,
  ImageField,
  RegistrationForm,
  SearchPanel,
  Tabs,
  ViewIntro,
} from "../workspace/WorkspaceUi.jsx";

export function LocationsView() {
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("");
  const visibleLocations = SAMPLE_LOCATIONS.filter((record) => (
    `${record.name} ${record.specialty} ${record.details.join(" ")}`
      .toLocaleLowerCase("es")
      .includes(query.trim().toLocaleLowerCase("es"))
  ));

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Locaciones"
        title="Espacios para cada historia"
        copy="Busca espacios disponibles o registra una nueva locación."
      />
      <Tabs
        label="Opciones de locaciones"
        value={mode}
        onChange={setMode}
        items={[["search", "Buscar locaciones"], ["register", "Registrar locación"]]}
      />
      {mode === "search" ? (
        <SearchPanel
          placeholder="Buscar por nombre o ubicación"
          filters={["Ubicación", "Horario", "Presupuesto"]}
          emptyMessage="Las locaciones registradas aparecerán aquí."
          query={query}
          onQueryChange={setQuery}
        >
          <CatalogGrid records={visibleLocations} emptyMessage="No encontramos locaciones con esa búsqueda." />
        </SearchPanel>
      ) : (
        <RegistrationForm submitLabel="Enviar registro">
          <FormField label="Nombre de la locación" />
          <FormField label="Ubicación" />
          <FormField label="Horarios disponibles" wide />
          <FormField label="Presupuesto por hora" type="number" />
          <ImageField label="Fotos" hint="Máximo 5 imágenes" />
          <div className="form-notice is-wide">
            <span>Confirmación</span>
            Recibirás un correo al enviar la solicitud. La publicación quedará pendiente de respuesta.
          </div>
        </RegistrationForm>
      )}
    </div>
  );
}
