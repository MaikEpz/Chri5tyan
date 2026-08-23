import { useCallback, useState } from "react";
import { AdminDialog } from "../../components/admin/AdminDialog.jsx";
import { AdminTextInput } from "../../components/admin/AdminTextInput.jsx";
import { AdminToolbar } from "../../components/admin/AdminToolbar.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { AdminCatalogCard } from "../../components/ui/AdminCatalogCard.jsx";
import { CheckboxField } from "../../components/ui/CheckboxField.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Notice } from "../../components/ui/Notice.jsx";
import { TextField } from "../../components/ui/TextField.jsx";
import { ImageCarousel } from "../../components/catalog/ImageCarousel.jsx";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";
import { AsyncImage } from "../../components/ui/AsyncImage.jsx";
import { ImageField } from "../../components/forms/ImageField.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";

const EMPTY_EQUIPMENT = Object.freeze({
  name: "",
  category: "Cámara",
  specifications: "",
  availability: "Disponible",
  dailyRate: "",
  active: true,
});

export function AdminEquipmentView({ catalogService }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_EQUIPMENT);
  const [retainedImages, setRetainedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");

  const request = useCallback(
    (page, signal) => catalogService.listEquipmentAdmin({
      q: query.trim() || undefined,
      active: active === "" ? undefined : active,
      page,
      size: 20,
      sort: "createdAt,desc",
    }, signal),
    [active, catalogService, query, revision],
  );
  const catalog = useCatalogPage(request, { preserveOnError: true });

  const openCreate = () => {
    setEditing({ isNew: true });
    setFormValues(EMPTY_EQUIPMENT);
    setRetainedImages([]);
    setNewImages([]);
    setFormError("");
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormValues({
      name: record.name,
      category: record.category,
      specifications: record.specifications,
      availability: record.availability,
      dailyRate: String(record.dailyRate),
      active: record.active,
    });
    setRetainedImages(record.images || []);
    setNewImages([]);
    setFormError("");
  };

  const setValue = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const totalImages = editing?.isNew
      ? newImages.length
      : retainedImages.length + newImages.length;

    if (totalImages < 1) {
      setFormError(editing?.isNew
        ? "Debe subir al menos 1 foto y máximo 5 fotos"
        : "Debe mantener al menos 1 foto y máximo 5 fotos");
      return;
    }
    if (totalImages > 5) {
      setFormError("Se permiten máximo 5 fotos");
      return;
    }

    const payload = {
      ...formValues,
      dailyRate: Number(formValues.dailyRate),
      retainedImageIds: editing?.isNew
        ? undefined
        : retainedImages.map((image) => image.id),
    };
    setBusy(true);
    setFormError("");
    try {
      if (editing.isNew) await catalogService.createEquipment(payload, newImages);
      else await catalogService.updateEquipment(editing.id, payload, newImages);
      setFeedback(`Equipo ${editing.isNew ? "creado" : "actualizado"} correctamente.`);
      setEditing(null);
      setRevision((value) => value + 1);
    } catch (error) {
      setFormError(error?.message || "No se pudo guardar el equipo.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`¿Eliminar ${record.name}? Esta acción lo ocultará del catálogo.`)) return;
    setFeedback("");
    try {
      await catalogService.deleteEquipment(record.id);
      setFeedback(`${record.name} fue eliminado.`);
      setRevision((value) => value + 1);
    } catch (error) {
      setFeedback(error?.message || "No se pudo eliminar el equipo.");
    }
  };

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Administración"
        title="Gestión de equipos"
        copy="Crea, actualiza y retira equipos del catálogo público."
      />
      <AdminToolbar
        query={query}
        active={active}
        onQueryChange={setQuery}
        onActiveChange={setActive}
        onCreate={openCreate}
        createLabel="Nuevo equipo"
      />
      {feedback && <Notice className="my-4" tone="success">{feedback}</Notice>}
      {catalog.error && <CatalogLoadState {...catalog} hasMore={false} onLoadMore={catalog.loadMore} />}
      {!catalog.loading && !catalog.error && catalog.records.length === 0 && (
        <EmptyState message="No hay equipos para este filtro." />
      )}
      {catalog.loading ? <LoadingSkeletons label="Cargando equipos administrativos" variant="admin" /> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={catalog.loadingMore || undefined}>
        {catalog.records.map((record) => (
          <AdminCatalogCard
            key={record.id}
            active={record.active}
            eyebrow={record.category}
            title={record.name}
            description={record.specifications}
            meta={`${record.availability} · $${Number(record.dailyRate).toFixed(2)} por día`}
            actions={<><Button size="compact" variant="secondary" onClick={() => openEdit(record)}>Editar</Button><Button size="compact" variant="danger" onClick={() => remove(record)}>Eliminar</Button></>}
          >
            <ImageCarousel images={record.images} alt={record.name} />
          </AdminCatalogCard>
        ))}
        {catalog.loadingMore && <LoadingSkeletons className="is-inline" count={3} label="Cargando más equipos" variant="admin" />}
      </div>}
      {!catalog.error && <CatalogLoadState {...catalog} onLoadMore={catalog.loadMore} />}
      {editing && (
        <AdminDialog title={editing.isNew ? "Nuevo equipo" : `Editar ${editing.name}`}>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
            <AdminTextInput label="Nombre" value={formValues.name} onChange={(value) => setValue("name", value)} maxLength="140" />
            <AdminTextInput label="Categoría" value={formValues.category} onChange={(value) => setValue("category", value)} maxLength="40" />
            <AdminTextInput label="Disponibilidad" value={formValues.availability} onChange={(value) => setValue("availability", value)} maxLength="160" />
            <AdminTextInput label="Tarifa diaria" type="number" min="0" step="0.01" value={formValues.dailyRate} onChange={(value) => setValue("dailyRate", value)} />
            <TextField className="md:col-span-2" label="Especificaciones" multiline required maxLength="4000" value={formValues.specifications} onChange={(event) => setValue("specifications", event.target.value)} />
            <CheckboxField checked={formValues.active} onChange={(event) => setValue("active", event.target.checked)}>Visible en el catálogo</CheckboxField>
            {retainedImages.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3 md:col-span-2" aria-label="Imágenes actuales">
                {retainedImages.map((image) => (
                  <figure className="relative m-0 overflow-hidden rounded-xl bg-black/20" key={image.id}>
                    <AsyncImage wrapperClassName="aspect-4/3" className="h-full w-full object-cover" src={image.url} alt="Imagen actual del equipo" loading="lazy" decoding="async" />
                    <Button className="absolute top-2 right-2" size="icon" variant="danger" aria-label="Eliminar imagen actual" onClick={() => setRetainedImages((items) => items.filter((item) => item.id !== image.id))}>×</Button>
                  </figure>
                ))}
              </div>
            )}
            <div className="md:col-span-2">
              <ImageField
                label="Nuevas imágenes"
                hint={`${retainedImages.length + newImages.length}/5 seleccionadas (mínimo 1)`}
                files={newImages}
                onFilesChange={setNewImages}
                maxFiles={Math.max(0, 5 - retainedImages.length)}
              />
            </div>
            {formError && <Notice className="md:col-span-2" role="alert" tone="danger">{formError}</Notice>}
            <div className="flex flex-wrap justify-end gap-3 pt-2 md:col-span-2">
              <Button disabled={busy} variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar equipo"}</Button>
            </div>
          </form>
        </AdminDialog>
      )}
    </div>
  );
}
