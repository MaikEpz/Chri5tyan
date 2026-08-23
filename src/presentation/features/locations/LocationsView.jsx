import { useCallback, useEffect, useState } from "react";
import { Notice } from "../../components/ui/Notice.jsx";
import { SelectField } from "../../components/ui/SelectField.jsx";
import { TextField } from "../../components/ui/TextField.jsx";
import { CatalogGrid } from "../../components/catalog/CatalogGrid.jsx";
import { SearchPanel } from "../../components/catalog/SearchPanel.jsx";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { FormField } from "../../components/forms/FormField.jsx";
import { ImageField } from "../../components/forms/ImageField.jsx";
import { RegistrationForm } from "../../components/forms/RegistrationForm.jsx";
import { Tabs } from "../../components/layout/Tabs.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";

export function LocationsView({ catalogService, runProtected }) {
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("");
  const [searchProvinceId, setSearchProvinceId] = useState("");
  const [searchCityId, setSearchCityId] = useState("");
  const [availability, setAvailability] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const [formKey, setFormKey] = useState(0);
  const [formProvinceId, setFormProvinceId] = useState("");
  const [formCityId, setFormCityId] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [searchCities, setSearchCities] = useState([]);
  const [formCities, setFormCities] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve(catalogService.getProvinces(controller.signal))
      .then((records) => {
        if (!controller.signal.aborted) setProvinces(records);
      })
      .catch((loadError) => {
        if (loadError?.name !== "AbortError") {
          setError(loadError?.message || "No se pudieron cargar las provincias.");
        }
      });
    return () => controller.abort();
  }, [catalogService]);

  useEffect(() => {
    if (!searchProvinceId) {
      setSearchCities([]);
      return undefined;
    }
    const controller = new AbortController();
    void Promise.resolve(catalogService.getCities(searchProvinceId, controller.signal))
      .then((records) => {
        if (!controller.signal.aborted) setSearchCities(records);
      })
      .catch((loadError) => {
        if (loadError?.name !== "AbortError") setSearchCities([]);
      });
    return () => controller.abort();
  }, [catalogService, searchProvinceId]);

  useEffect(() => {
    if (!formProvinceId) {
      setFormCities([]);
      return undefined;
    }
    const controller = new AbortController();
    void Promise.resolve(catalogService.getCities(formProvinceId, controller.signal))
      .then((records) => {
        if (!controller.signal.aborted) setFormCities(records);
      })
      .catch((loadError) => {
        if (loadError?.name !== "AbortError") setFormCities([]);
      });
    return () => controller.abort();
  }, [catalogService, formProvinceId]);

  const handleSearchProvinceChange = (event) => {
    setSearchProvinceId(event.target.value);
    setSearchCityId("");
  };

  const handleFormProvinceChange = (event) => {
    setFormProvinceId(event.target.value);
    setFormCityId("");
  };

  const request = useCallback(
    (page, signal) => catalogService.listLocations({
      q: query.trim(),
      provinceId: searchProvinceId || undefined,
      cityId: searchCityId || undefined,
      availability: availability.trim() || undefined,
      maxBudget: maxBudget || undefined,
      page,
      size: 12,
      sort: "createdAt,desc",
    }, signal),
    [availability, catalogService, maxBudget, query, searchCityId, searchProvinceId],
  );
  const catalog = useCatalogPage(request);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);

    const selectedProvince = provinces.find((p) => p.id === formProvinceId);
    const selectedCity = formCities.find((c) => c.id === formCityId);

    const payload = {
      name: values.get("name"),
      address: values.get("address"),
      provinceId: formProvinceId,
      provinceName: selectedProvince?.name || "",
      cityId: formCityId,
      cityName: selectedCity?.name || "",
      city: selectedCity?.name || "",
      availability: values.get("availability"),
      description: values.get("description"),
      hourlyBudget: Number(values.get("hourlyBudget")),
      hourlyBudgetNegotiable: values.get("hourlyBudgetNegotiable") === "on",
    };

    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (images.length < 1) {
        setError("Debe subir al menos 1 foto y máximo 5 fotos");
        return;
      }
      if (images.length > 5) {
        setError("Se permiten máximo 5 fotos");
        return;
      }
      await runProtected(() => catalogService.createLocation(payload, images));
      setMessage("Locación enviada. Quedará visible cuando sea aprobada.");
      form.reset();
      setFormProvinceId("");
      setFormCityId("");
      setImages([]);
      setFormKey((value) => value + 1);
    } catch (submitError) {
      if (submitError?.code !== "AUTH_CANCELLED") {
        setError(submitError?.message || "No se pudo enviar la locación.");
      }
    } finally {
      setBusy(false);
    }
  };

  const searchProvinceOptions = [
    ["", "Todas las provincias"],
    ...provinces.map((prov) => [prov.id, prov.name]),
  ];

  const searchCityOptions = [
    ["", "Todas las ciudades"],
    ...searchCities.map((city) => [city.id, city.name]),
  ];

  const formProvinceOptions = [
    ["", "Selecciona una provincia"],
    ...provinces.map((prov) => [prov.id, prov.name]),
  ];

  const formCityOptions = [
    ["", formProvinceId ? "Selecciona una ciudad" : "Primero selecciona una provincia"],
    ...formCities.map((city) => [city.id, city.name]),
  ];

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Locaciones"
        title="Espacios para cada historia"
        copy="Busca espacios disponibles o registra una nueva locación."
      />
      <Tabs
        items={[["search", "Buscar locaciones"], ["register", "Registrar locación"]]}
        label="Opciones de locaciones"
        onChange={setMode}
        value={mode}
      />
      {mode === "search" ? (
        <SearchPanel
          filters={[]}
          activeFilterCount={[
            searchProvinceId,
            searchCityId,
            availability,
            maxBudget,
          ].filter(Boolean).length}
          filterContent={(
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SelectField label="Provincia" value={searchProvinceId} onChange={handleSearchProvinceChange}>
                  {searchProvinceOptions.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
              </SelectField>
              <SelectField label="Ciudad" disabled={!searchProvinceId} value={searchCityId} onChange={(event) => setSearchCityId(event.target.value)}>
                  {searchCityOptions.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
              </SelectField>
              <TextField label="Disponibilidad" onChange={(event) => setAvailability(event.target.value)} value={availability} />
              <TextField label="Presupuesto máximo" min="0" onChange={(event) => setMaxBudget(event.target.value)} type="number" value={maxBudget} />
            </div>
          )}
          onQueryChange={setQuery}
          placeholder="Buscar por nombre o ubicación"
          query={query}
        >
          <CatalogGrid
            emptyMessage="No encontramos locaciones con esa búsqueda."
            records={catalog.records}
            error={catalog.error}
            loading={catalog.loading}
            loadingMore={catalog.loadingMore}
          />
          <CatalogLoadState {...catalog} onLoadMore={catalog.loadMore} />
        </SearchPanel>
      ) : (
        <RegistrationForm
          key={formKey}
          busy={busy}
          error={error}
          message={message}
          onSubmit={handleSubmit}
          submitLabel="Enviar registro"
        >
          <FormField label="Nombre de la locación" name="name" required />
          <FormField
            label="Provincia"
            name="provinceId"
            onChange={handleFormProvinceChange}
            options={formProvinceOptions}
            required
            value={formProvinceId}
          />
          <FormField
            disabled={!formProvinceId}
            label="Ciudad"
            name="cityId"
            onChange={(event) => setFormCityId(event.target.value)}
            options={formCityOptions}
            required
            value={formCityId}
          />
          <FormField label="Dirección" name="address" required />
          <FormField
            label="Presupuesto por hora"
            min="0"
            name="hourlyBudget"
            required
            step="0.01"
            type="number"
          />
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input name="hourlyBudgetNegotiable" type="checkbox" />
            Tarifa por hora negociable
          </label>
          <FormField label="Descripción" name="description" required textarea wide />
          <FormField label="Horarios disponibles" name="availability" required textarea wide />
          <ImageField
            files={images}
            hint="Requerido: Mínimo 1, máximo 5 fotos (JPEG, PNG o WebP)"
            label="Fotos"
            onFilesChange={setImages}
          />
          <Notice className="col-span-full"><strong className="mr-2">Confirmación</strong>Recibirás un correo y la publicación quedará pendiente de aprobación.</Notice>
        </RegistrationForm>
      )}
    </div>
  );
}
