import { useCallback, useState } from "react";
import { CatalogGrid } from "../../components/catalog/CatalogGrid.jsx";
import { SearchPanel } from "../../components/catalog/SearchPanel.jsx";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";

const EQUIPMENT_CATEGORIES = Object.freeze([
  "Todos",
  "Iluminación",
  "Cámara",
  "Sonido",
  "Gripería",
  "Otros",
]);

export function EquipmentView({ catalogService }) {
  const [category, setCategory] = useState(EQUIPMENT_CATEGORIES[0]);
  const [query, setQuery] = useState("");
  const request = useCallback(
    (page, signal) => catalogService.listEquipment({
      q: query.trim(),
      category: category === "Todos" ? undefined : category,
      page,
      size: 12,
      sort: "createdAt,desc",
    }, signal),
    [catalogService, category, query],
  );
  const catalog = useCatalogPage(request);

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
        activeFilterCount={category === EQUIPMENT_CATEGORIES[0] ? 0 : 1}
        activeFilter={category}
        onFilterChange={setCategory}
        query={query}
        onQueryChange={setQuery}
      >
        <CatalogGrid
          records={catalog.records}
          emptyMessage="No encontramos equipos con esos filtros."
          error={catalog.error}
          loading={catalog.loading}
          loadingMore={catalog.loadingMore}
        />
        <CatalogLoadState {...catalog} onLoadMore={catalog.loadMore} />
      </SearchPanel>
    </div>
  );
}
