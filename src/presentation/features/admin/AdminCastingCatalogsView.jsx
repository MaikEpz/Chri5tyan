import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Notice } from "../../components/ui/Notice.jsx";
import { Tabs } from "../../components/layout/Tabs.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";

const TYPES = Object.freeze([
  ["SEX", "Sexo", "sexes"],
  ["SKIN_TONE", "Tonos de piel", "skinTones"],
  ["CULTURE", "Culturas", "cultures"],
]);

const inputClass = "min-h-11 rounded-xl border border-white/15 bg-chris-surface px-3 text-white outline-none focus:border-white/35";

export function AdminCastingCatalogsView({ catalogService }) {
  const [type, setType] = useState("SEX");
  const [catalogs, setCatalogs] = useState({ sexes: [], skinTones: [], cultures: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ name: "", displayOrder: 0, active: true });
  const [, , key] = TYPES.find(([value]) => value === type);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try { setCatalogs(await catalogService.getCastingCatalogsAdmin(signal)); }
    catch (loadError) { if (loadError?.name !== "AbortError") setError(loadError?.message || "No se pudieron cargar los catálogos."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [catalogService]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const mutate = async (operation, success) => {
    setError(""); setMessage("");
    try { await operation(); setMessage(success); await load(); }
    catch (mutationError) { setError(mutationError?.message || "No se pudo guardar el catálogo."); }
  };

  const updateOption = (option, changes) => mutate(
    () => catalogService.updateCastingCatalogOption(type, option.id, {
      name: changes.name ?? option.name,
      displayOrder: Number(changes.displayOrder ?? option.displayOrder),
      active: changes.active ?? option.active,
    }),
    "Opción actualizada.",
  );

  return (
    <div className="workspace-view">
      <ViewIntro eyebrow="Administración" title="Catálogos de casting" copy="Controla las opciones disponibles en formularios y filtros." />
      <Tabs label="Tipo de catálogo" value={type} onChange={setType} items={TYPES.map(([value, label]) => [value, label])} />
      {error && <Notice className="my-4" role="alert" tone="danger">{error}</Notice>}
      {message && <Notice className="my-4" tone="success">{message}</Notice>}
      {type !== "SEX" && (
        <form className="my-5 grid gap-3 rounded-chris-card bg-white/3 p-4 sm:grid-cols-[1fr_8rem_auto]" onSubmit={(event) => {
          event.preventDefault();
          if (!draft.name.trim()) return;
          mutate(() => catalogService.createCastingCatalogOption(type, { ...draft, displayOrder: Number(draft.displayOrder) }), "Opción creada.");
          setDraft({ name: "", displayOrder: 0, active: true });
        }}>
          <input aria-label="Nombre de la opción" className={inputClass} maxLength="100" placeholder="Nueva opción" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          <input aria-label="Orden" className={inputClass} min="0" type="number" value={draft.displayOrder} onChange={(event) => setDraft((current) => ({ ...current, displayOrder: event.target.value }))} />
          <Button type="submit">Crear</Button>
        </form>
      )}
      {type === "SEX" && <Notice className="my-5">Sexo está limitado a Masculino y Femenino; se pueden renombrar, ordenar o desactivar, pero no crear ni eliminar opciones.</Notice>}
      {loading ? <LoadingSkeletons label="Cargando catálogos administrativos" variant="row" /> : (
        <div className="admin-catalog-options-grid grid grid-cols-1 gap-4 md:grid-cols-2">
          {catalogs[key].map((option) => <CatalogRow key={option.id} option={option} canDelete={type !== "SEX"} onSave={updateOption} onDelete={() => mutate(() => catalogService.deleteCastingCatalogOption(type, option.id), "Opción desactivada.")} />)}
        </div>
      )}
    </div>
  );
}

function CatalogRow({ option, canDelete, onSave, onDelete }) {
  const [name, setName] = useState(option.name);
  const [displayOrder, setDisplayOrder] = useState(option.displayOrder);
  return (
    <article className="admin-catalog-option-card grid min-w-0 gap-4 rounded-xl bg-white/3 p-4 transition-colors hover:bg-white/5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <input aria-label={`Nombre de ${option.name}`} className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        <input aria-label={`Orden de ${option.name}`} className={inputClass} min="0" type="number" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-white/65"><input checked={option.active} type="checkbox" onChange={(event) => onSave(option, { name, displayOrder, active: event.target.checked })} /> Activa</label>
        <div className="flex flex-wrap gap-2"><Button size="compact" onClick={() => onSave(option, { name, displayOrder })}>Guardar</Button>{canDelete && option.active && <Button size="compact" variant="danger" onClick={onDelete}>Desactivar</Button>}</div>
      </div>
    </article>
  );
}
