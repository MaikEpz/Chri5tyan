import { useState } from "react";
import { SAMPLE_CASTING } from "../../../domain/catalog/sampleRecords.js";
import {
  CatalogGrid,
  FormField,
  ImageField,
  RegistrationForm,
  SearchPanel,
  Tabs,
  ViewIntro,
} from "../workspace/WorkspaceUi.jsx";

export function CastingView() {
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("");
  const visibleCasting = SAMPLE_CASTING.filter((record) => (
    `${record.name} ${record.specialty} ${record.details.join(" ")}`
      .toLocaleLowerCase("es")
      .includes(query.trim().toLocaleLowerCase("es"))
  ));

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Casting"
        title="Encuentra el talento correcto"
        copy="Explora la base de actores o crea un nuevo perfil."
      />
      <Tabs
        label="Opciones de casting"
        value={mode}
        onChange={setMode}
        items={[["search", "Buscar actores"], ["register", "Registrar actor"]]}
      />
      {mode === "search" ? (
        <SearchPanel
          placeholder="Buscar por nombre, edad o experiencia"
          filters={["Edad", "Sexo", "Tono de piel", "Cultura", "Disponibilidad"]}
          emptyMessage="La base de casting aparecerá aquí."
          query={query}
          onQueryChange={setQuery}
        >
          <CatalogGrid records={visibleCasting} emptyMessage="No encontramos actores con esa búsqueda." />
        </SearchPanel>
      ) : (
        <RegistrationForm submitLabel="Guardar perfil">
          <FormField label="Nombre" />
          <FormField label="Edad" type="number" />
          <FormField label="Sexo" options={["Seleccionar", "Femenino", "Masculino", "Otro"]} />
          <FormField label="Altura" type="number" placeholder="cm" />
          <FormField label="Tono de piel" />
          <FormField label="Cultura" />
          <FormField label="Experiencia" wide />
          <FormField label="Horarios disponibles" wide />
          <FormField label="Presupuesto" type="number" />
          <ImageField label="Fotos" hint="Máximo 5, calidad Instagram" />
        </RegistrationForm>
      )}
    </div>
  );
}
