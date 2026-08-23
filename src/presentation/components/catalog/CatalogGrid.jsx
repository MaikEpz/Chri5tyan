import { EmptyState } from "../ui/EmptyState.jsx";
import { LoadingSkeletons } from "../ui/LoadingSkeletons.jsx";
import { CatalogCard } from "./CatalogCard.jsx";

export function CatalogGrid({ records, emptyMessage, error = "", loading = false, loadingMore = false }) {
  if (loading) return <LoadingSkeletons label="Cargando catálogo" variant="catalog" />;
  if (error && !records.length) return null;
  if (!records.length) return <EmptyState icon="⌕" message={emptyMessage} />;
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={loadingMore || undefined}>
      {records.map((record) => <CatalogCard key={record.id} record={record} />)}
      {loadingMore && <LoadingSkeletons className="is-inline" count={3} label="Cargando más resultados" variant="catalog" />}
    </div>
  );
}
