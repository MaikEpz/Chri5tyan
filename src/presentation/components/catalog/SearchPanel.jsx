import { EmptyState } from "../ui/EmptyState.jsx";
import { CollapsibleFilters } from "../ui/CollapsibleFilters.jsx";
import { FilterPills } from "../ui/FilterPills.jsx";

export function SearchPanel({ placeholder, filters = [], filterContent, activeFilterCount = 0, emptyMessage, activeFilter, onFilterChange, query = "", onQueryChange, children }) {
  const hasFilters = filters.length > 0 || Boolean(filterContent);

  return (
    <section className="grid gap-3">
      <label className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-chris-surface px-4 transition-colors focus-within:border-white/35 focus-within:ring-2 focus-within:ring-white/10"><span className="text-xl text-white/40" aria-hidden="true">⌕</span><input className="min-h-14 w-full border-0 bg-transparent text-base text-white outline-none placeholder:text-white/35" type="search" placeholder={placeholder} value={query} onChange={(event) => onQueryChange?.(event.target.value)} /></label>
      {hasFilters && (
        <CollapsibleFilters
          activeCount={activeFilterCount}
          className=""
          contentClassName="p-3"
        >
          {filters.length > 0 && <FilterPills items={filters.map((filter) => [filter, filter])} label="Categoría" onChange={onFilterChange} value={activeFilter} />}
          {filterContent}
        </CollapsibleFilters>
      )}
      {children || <EmptyState icon="＋" message={emptyMessage} />}
    </section>
  );
}
