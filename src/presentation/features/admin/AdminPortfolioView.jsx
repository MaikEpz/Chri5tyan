import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminDialog } from "../../components/admin/AdminDialog.jsx";
import { AdminTextInput } from "../../components/admin/AdminTextInput.jsx";
import { AdminToolbar } from "../../components/admin/AdminToolbar.jsx";
import { AdminCatalogCard } from "../../components/ui/AdminCatalogCard.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { CheckboxField } from "../../components/ui/CheckboxField.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { FilterPills } from "../../components/ui/FilterPills.jsx";
import { Notice } from "../../components/ui/Notice.jsx";
import { SelectField } from "../../components/ui/SelectField.jsx";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";
import { AsyncImage, AsyncVideo } from "../../components/ui/AsyncImage.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";

const EMPTY_ITEM = Object.freeze({
  type: "PHOTO",
  title: "",
  category: "",
  client: "",
  active: true,
  displayOrder: "0",
  removeCover: false,
});

function usePreview(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

export function AdminPortfolioView({ catalogService }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [type, setType] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY_ITEM);
  const [media, setMedia] = useState(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const mediaPreview = usePreview(media);
  const coverPreview = usePreview(cover);

  const request = useCallback(
    (page, signal) => catalogService.listPortfolioAdmin({
      q: query.trim() || undefined,
      type: type || undefined,
      active: active === "" ? undefined : active,
      page,
      size: 20,
      sort: "displayOrder,asc",
    }, signal),
    [active, catalogService, query, revision, type],
  );
  const catalog = useCatalogPage(request, { preserveOnError: true });

  const setValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));
  const openCreate = () => {
    setEditing({ isNew: true });
    setValues(EMPTY_ITEM);
    setMedia(null);
    setCover(null);
    setFormError("");
  };
  const openEdit = (record) => {
    setEditing(record);
    setValues({
      type: record.type,
      title: record.title,
      category: record.category,
      client: record.client,
      active: record.active,
      displayOrder: String(record.displayOrder),
      removeCover: false,
    });
    setMedia(null);
    setCover(null);
    setFormError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const typeChanged = !editing.isNew && editing.type !== values.type;
    if ((editing.isNew || typeChanged) && !media) {
      setFormError("Selecciona el archivo principal.");
      return;
    }
    const payload = { ...values, displayOrder: Number(values.displayOrder) };
    setBusy(true);
    setFormError("");
    try {
      if (editing.isNew) await catalogService.createPortfolioItem(payload, media, cover);
      else await catalogService.updatePortfolioItem(editing.id, payload, media, cover);
      setFeedback(`Pieza ${editing.isNew ? "creada" : "actualizada"} correctamente.`);
      setEditing(null);
      setRevision((value) => value + 1);
    } catch (error) {
      setFormError(error?.message || "No se pudo guardar la pieza.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`¿Eliminar “${record.title}”?`)) return;
    setFeedback("");
    try {
      await catalogService.deletePortfolioItem(record.id);
      setFeedback(`${record.title} fue eliminado del portafolio.`);
      setRevision((value) => value + 1);
    } catch (error) {
      setFeedback(error?.message || "No se pudo eliminar la pieza.");
    }
  };

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Administración"
        title="Gestión de portafolio"
        copy="Publica fotos y videos que aparecerán en la experiencia del iPhone."
      />
      <AdminToolbar
        query={query}
        active={active}
        additionalActiveCount={type ? 1 : 0}
        onQueryChange={setQuery}
        onActiveChange={setActive}
        onCreate={openCreate}
        createLabel="Nueva pieza"
      >
        <div className="md:col-span-2">
          <span className="mb-2 block text-sm text-chris-muted">Tipo de pieza</span>
          <FilterPills items={[["", "Todos"], ["PHOTO", "Fotos"], ["VIDEO", "Videos"]]} label="Tipo de pieza" value={type} onChange={setType} />
        </div>
      </AdminToolbar>
      {feedback && <Notice className="my-4" tone="success">{feedback}</Notice>}
      {catalog.error && <CatalogLoadState {...catalog} hasMore={false} onLoadMore={catalog.loadMore} />}
      {!catalog.loading && !catalog.error && catalog.records.length === 0 && <EmptyState message="No hay piezas para este filtro." />}
      {catalog.loading ? <LoadingSkeletons label="Cargando portafolio administrativo" variant="admin" /> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={catalog.loadingMore || undefined}>
        {catalog.records.map((record) => (
          <AdminCatalogCard
            key={record.id}
            active={record.active}
            eyebrow={`${record.type === "PHOTO" ? "Foto" : "Video"} · ${record.category}`}
            title={record.title}
            description={record.client}
            meta={`Orden ${record.displayOrder}`}
            actions={<><Button size="compact" variant="secondary" onClick={() => openEdit(record)}>Editar</Button><Button size="compact" variant="danger" onClick={() => remove(record)}>Eliminar</Button></>}
          >
            <PortfolioMedia record={record} />
          </AdminCatalogCard>
        ))}
        {catalog.loadingMore && <LoadingSkeletons className="is-inline" count={3} label="Cargando más piezas" variant="admin" />}
      </div>}
      {!catalog.error && <CatalogLoadState {...catalog} onLoadMore={catalog.loadMore} />}
      {editing && (
        <AdminDialog title={editing.isNew ? "Nueva pieza" : `Editar ${editing.title}`}>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
            <SelectField label="Tipo" value={values.type} onChange={(event) => { setValue("type", event.target.value); setCover(null); }}><option value="PHOTO">Foto</option><option value="VIDEO">Video</option></SelectField>
            <AdminTextInput label="Título" maxLength="140" value={values.title} onChange={(value) => setValue("title", value)} />
            <AdminTextInput label="Categoría" maxLength="80" value={values.category} onChange={(value) => setValue("category", value)} />
            <AdminTextInput label="Cliente" maxLength="120" value={values.client} onChange={(value) => setValue("client", value)} />
            <AdminTextInput label="Orden" type="number" min="0" step="1" value={values.displayOrder} onChange={(value) => setValue("displayOrder", value)} />
            <CheckboxField checked={values.active} onChange={(event) => setValue("active", event.target.checked)}>Visible en el portafolio</CheckboxField>
            <SingleMediaField
              label={editing.isNew ? "Archivo principal" : "Reemplazar archivo principal"}
              accept={values.type === "PHOTO" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm,video/quicktime"}
              file={media}
              preview={mediaPreview}
              existing={!media && (!editing.type || editing.type === values.type)
                ? editing.media
                : null}
              type={values.type}
              onChange={setMedia}
            />
            {values.type === "VIDEO" && (
              <SingleMediaField
                label="Portada opcional"
                accept="image/jpeg,image/png,image/webp"
                file={cover}
                preview={coverPreview}
                existing={!cover && !values.removeCover ? editing.cover : null}
                type="PHOTO"
                onChange={(file) => { setCover(file); if (file) setValue("removeCover", false); }}
                onRemoveExisting={() => setValue("removeCover", true)}
              />
            )}
            {formError && <Notice className="md:col-span-2" role="alert" tone="danger">{formError}</Notice>}
            <div className="flex flex-wrap justify-end gap-3 pt-2 md:col-span-2"><Button disabled={busy} variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar pieza"}</Button></div>
          </form>
        </AdminDialog>
      )}
    </div>
  );
}

function PortfolioMedia({ record }) {
  if (record.type === "VIDEO") return <AsyncVideo wrapperClassName="aspect-video" className="h-full w-full bg-black object-cover" src={record.media?.url} poster={record.cover?.url} controls preload="metadata" aria-label={`Video ${record.title}`} />;
  return record.media ? <AsyncImage wrapperClassName="aspect-video" className="h-full w-full bg-black object-cover" src={record.media.url} alt={record.title} loading="lazy" decoding="async" /> : null;
}

function SingleMediaField({ label, accept, existing, file, preview, type, onChange, onRemoveExisting }) {
  return (
    <div className="grid gap-3 md:col-span-2">
      <label className="grid gap-2 text-xs text-white/60"><span>{label}</span><input className="min-h-12 w-full rounded-xl border border-white/15 bg-chris-surface px-3.5 py-3 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:font-semibold file:text-black" type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} /></label>
      {(preview || existing?.url) && (
        <figure className="relative m-0 w-fit max-w-full overflow-hidden rounded-xl bg-black">
          {type === "VIDEO" ? <AsyncVideo wrapperClassName="aspect-video w-64 max-w-full" className="h-full w-full object-contain" src={preview || existing.url} controls /> : <AsyncImage wrapperClassName="aspect-video w-64 max-w-full" className="h-full w-full object-contain" src={preview || existing.url} alt={`Previsualización de ${label}`} />}
          <figcaption className="max-w-64 truncate px-3 py-2 text-xs text-white/55">{file?.name || "Archivo actual"}</figcaption>
          {(file || onRemoveExisting) && (
            <Button className="absolute top-2 right-2" size="icon" variant="danger" aria-label={`Eliminar ${label}`} onClick={() => { if (file) onChange(null); else onRemoveExisting(); }}>×</Button>
          )}
        </figure>
      )}
    </div>
  );
}
