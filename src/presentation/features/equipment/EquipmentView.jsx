import { useState } from "react";
import { SAMPLE_EQUIPMENT } from "../../../domain/catalog/sampleRecords.js";
import { CatalogGrid, SearchPanel, ViewIntro } from "../workspace/WorkspaceUi.jsx";

const EQUIPMENT_CATEGORIES = Object.freeze([
  "Todos",
  "Iluminación",
  "Cámara",
  "Sonido",
  "Gripería",
  "Otros",
]);

export function EquipmentView() {
  const [category, setCategory] = useState(EQUIPMENT_CATEGORIES[0]);
  const [query, setQuery] = useState("");
  const visibleEquipment = SAMPLE_EQUIPMENT.filter((record) => {
    const matchesCategory = category === "Todos" || record.specialty === category;
    const matchesQuery = `${record.name} ${record.specialty} ${record.details.join(" ")}`
      .toLocaleLowerCase("es")
      .includes(query.trim().toLocaleLowerCase("es"));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Alquiler de equipos"
        title="Todo lo necesario, en un solo lugar"
        copy="Busca equipos por nombre o explora cada categoría."
      />
      <SearchPanel
        placeholder="Buscar equipo por nombre"
        filters={EQUIPMENT_CATEGORIES}
        activeFilter={category}
        onFilterChange={setCategory}
        emptyMessage={`Los equipos de ${category.toLowerCase()} aparecerán aquí.`}
        query={query}
        onQueryChange={setQuery}
      >
        <CatalogGrid records={visibleEquipment} emptyMessage="No encontramos equipos con esos filtros." />
      </SearchPanel>
    </div>
  );
}
