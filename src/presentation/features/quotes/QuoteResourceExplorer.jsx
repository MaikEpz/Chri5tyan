import { useCallback, useEffect, useRef, useState } from "react";
import {
  canQuoteLocation,
  createCastingQuoteSelection,
  createLocationQuoteSelection,
  getCastingQuoteRates,
} from "../../../application/production/quoteResourceSelections.js";
import { QUOTE_RATE_UNIT } from "../../../domain/production/productionQuote.js";
import { getCatalogImage } from "../../components/catalog/catalogImages.js";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { AsyncImage } from "../../components/ui/AsyncImage.jsx";
import { CollapsibleFilters } from "../../components/ui/CollapsibleFilters.jsx";
import { Dialog } from "../../components/ui/Dialog.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Notice } from "../../components/ui/Notice.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";
import { SelectField } from "../../components/ui/SelectField.jsx";
import { TextField } from "../../components/ui/TextField.jsx";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatUsd(value) {
  return USD.format(Number(value) || 0);
}

function imageFor(record) {
  return record.images?.[0]?.url || record.imageUrl || getCatalogImage(record.imageId || record.id);
}

function ResourceImage({ record }) {
  const source = imageFor(record);
  return source
    ? <AsyncImage wrapperClassName="aspect-[16/9]" className="h-full w-full object-cover" src={source} alt="" loading="lazy" decoding="async" />
    : <div className="grid aspect-[16/9] w-full place-items-center bg-white/4 text-xs text-white/35">Sin imagen</div>;
}

function rateOptions(record) {
  return getCastingQuoteRates(record).map((rate) => ({
    ...rate,
    label: rate.unit === QUOTE_RATE_UNIT.HOURLY ? "Hora" : "Jornada",
  }));
}

export function QuoteResourceExplorer({
  catalogService,
  initialTab = "casting",
  castingSelections,
  locationSelection,
  onApply,
  onClose,
}) {
  const dialogRef = useRef(null);
  const [tab, setTab] = useState(initialTab);
  const [draftCasting, setDraftCasting] = useState(() => castingSelections.map((item) => ({ ...item, rate: { ...item.rate } })));
  const [draftLocation, setDraftLocation] = useState(() => locationSelection ? { ...locationSelection, rate: { ...locationSelection.rate } } : null);
  const [castingQuery, setCastingQuery] = useState("");
  const [castingAvailability, setCastingAvailability] = useState("");
  const [castingRateUnit, setCastingRateUnit] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [locationAvailability, setLocationAvailability] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [geographyError, setGeographyError] = useState("");

  const castingRequest = useCallback((page, signal) => catalogService.listCasting({
    q: castingQuery.trim(),
    availability: castingAvailability.trim() || undefined,
    rateUnit: castingRateUnit || undefined,
    page,
    size: 12,
    sort: "createdAt,desc",
  }, signal), [catalogService, castingAvailability, castingQuery, castingRateUnit]);
  const locationRequest = useCallback((page, signal) => catalogService.listLocations({
    q: locationQuery.trim(),
    provinceId: provinceId || undefined,
    cityId: cityId || undefined,
    availability: locationAvailability.trim() || undefined,
    page,
    size: 12,
    sort: "createdAt,desc",
  }, signal), [catalogService, cityId, locationAvailability, locationQuery, provinceId]);
  const castingCatalog = useCatalogPage(castingRequest);
  const locationCatalog = useCatalogPage(locationRequest);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve(catalogService.getProvinces(controller.signal))
      .then((items) => !controller.signal.aborted && setProvinces(items))
      .catch((error) => {
        if (error?.name !== "AbortError") setGeographyError("No se pudieron cargar provincias y ciudades.");
      });
    return () => controller.abort();
  }, [catalogService]);

  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      return undefined;
    }
    const controller = new AbortController();
    Promise.resolve(catalogService.getCities(provinceId, controller.signal))
      .then((items) => !controller.signal.aborted && setCities(items))
      .catch(() => !controller.signal.aborted && setCities([]));
    return () => controller.abort();
  }, [catalogService, provinceId]);

  const toggleCasting = (record) => {
    const selected = draftCasting.find((item) => item.id === record.id);
    if (selected) {
      setDraftCasting((items) => items.filter((item) => item.id !== record.id));
      return;
    }
    const rates = rateOptions(record);
    if (!rates.length) return;
    setDraftCasting((items) => [...items, createCastingQuoteSelection(record, rates[0])]);
  };

  const updateCastingRate = (record, rate) => {
    setDraftCasting((items) => items.map((item) => (
      item.id === record.id ? createCastingQuoteSelection(record, rate) : item
    )));
  };

  const apply = () => onApply({
    castingSelections: draftCasting,
    locationSelection: draftLocation,
  });

  return (
    <Dialog
      ref={dialogRef}
      className="grid h-[min(92dvh,860px)] max-w-6xl grid-rows-[auto_auto_1fr_auto] overflow-hidden rounded-3xl p-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none"
      labelledBy="quote-resource-explorer-title"
      overlayClassName="max-sm:p-0"
      tabIndex="-1"
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-7">
        <div>
          <span className="text-xs font-bold tracking-[0.14em] text-chris-accent uppercase">Talento y espacios</span>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl" id="quote-resource-explorer-title">Arma tu selección</h2>
          <p className="mt-1 text-sm text-white/50">Añade los perfiles que necesites y una locación para esta cotización.</p>
        </div>
        <Button aria-label="Cerrar selector" className="shrink-0" size="icon" variant="secondary" onClick={onClose}>×</Button>
      </header>

      <div className="mx-5 mt-5 flex rounded-xl bg-white/5 p-1 sm:mx-7" role="tablist" aria-label="Recursos para la cotización">
        {[["casting", `Casting · ${draftCasting.length}`], ["locations", `Locación · ${draftLocation ? 1 : 0}`]].map(([id, label]) => (
          <button
            className="min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold text-white/50 transition-colors aria-selected:bg-white aria-selected:text-black focus-visible:outline-2 focus-visible:outline-white"
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >{label}</button>
        ))}
      </div>

      <div className="grid min-h-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="quote-resource-scroll min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
          {tab === "casting" ? (
            <CastingCatalog
              catalog={castingCatalog}
              availability={castingAvailability}
              query={castingQuery}
              rateUnit={castingRateUnit}
              selections={draftCasting}
              onAvailabilityChange={setCastingAvailability}
              onQueryChange={setCastingQuery}
              onRateChange={updateCastingRate}
              onRateUnitChange={setCastingRateUnit}
              onToggle={toggleCasting}
            />
          ) : (
            <LocationCatalog
              catalog={locationCatalog}
              availability={locationAvailability}
              cities={cities}
              geographyError={geographyError}
              provinceId={provinceId}
              provinces={provinces}
              query={locationQuery}
              selected={draftLocation}
              cityId={cityId}
              onAvailabilityChange={setLocationAvailability}
              onCityChange={setCityId}
              onProvinceChange={(value) => { setProvinceId(value); setCityId(""); }}
              onQueryChange={setLocationQuery}
              onClear={() => setDraftLocation(null)}
              onSelect={(record) => setDraftLocation(createLocationQuoteSelection(record))}
            />
          )}
        </div>

        <aside className="quote-resource-scroll hidden min-h-0 overflow-y-auto bg-white/3 p-6 lg:block" aria-label="Selección temporal">
          <SelectionSummary casting={draftCasting} location={draftLocation} onRemoveCasting={(id) => setDraftCasting((items) => items.filter((item) => item.id !== id))} onRemoveLocation={() => setDraftLocation(null)} />
        </aside>
      </div>

      <footer className="flex items-center justify-between gap-3 bg-chris-panel/95 px-5 py-4 shadow-[0_-1rem_3rem_rgba(0,0,0,0.25)] sm:px-7">
        <span className="text-xs text-white/45 max-sm:hidden">{draftCasting.length} casting · {draftLocation ? "1 locación" : "Sin locación"}</span>
        <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={apply}>Aplicar selección</Button></div>
      </footer>
    </Dialog>
  );
}

function CastingCatalog({ catalog, availability, query, rateUnit, selections, onAvailabilityChange, onQueryChange, onRateChange, onRateUnitChange, onToggle }) {
  return (
    <div className="grid gap-4">
      <TextField aria-label="Buscar casting para la cotización" placeholder="Buscar casting" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      <CollapsibleFilters activeCount={[availability, rateUnit].filter(Boolean).length} contentClassName="grid gap-3 p-4 sm:grid-cols-2">
        <SelectField label="Modalidad" value={rateUnit} onChange={(event) => onRateUnitChange(event.target.value)}><option value="">Cualquiera</option><option value="HOURLY">Por hora</option><option value="DAILY">Por jornada</option></SelectField>
        <TextField label="Disponibilidad" value={availability} onChange={(event) => onAvailabilityChange(event.target.value)} />
      </CollapsibleFilters>
      <CatalogLoadState {...catalog} hasMore={false} onLoadMore={catalog.loadMore} />
      {catalog.loading ? <LoadingSkeletons label="Cargando casting" variant="choice" /> : catalog.error ? null : catalog.records.length === 0 ? <EmptyState message="No encontramos perfiles con esos filtros." /> : (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy={catalog.loadingMore || undefined}>
          {catalog.records.map((record) => <CastingChoiceCard key={record.id} record={record} selected={selections.find((item) => item.id === record.id)} onRateChange={(rate) => onRateChange(record, rate)} onToggle={() => onToggle(record)} />)}
          {catalog.loadingMore && <LoadingSkeletons className="is-inline" count={2} label="Cargando más casting" variant="choice" />}
        </div>
      )}
      {catalog.hasMore && !catalog.loading && <Button className="mx-auto" variant="secondary" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? "Cargando…" : "Ver más"}</Button>}
    </div>
  );
}

function CastingChoiceCard({ onRateChange, onToggle, record, selected }) {
  const rates = rateOptions(record);
  const unavailable = rates.length === 0;
  return (
    <article className={`grid overflow-hidden rounded-2xl bg-white/4 transition-colors ${selected ? "ring-2 ring-white/55" : "hover:bg-white/7"}`}>
      <ResourceImage record={record} />
      <div className="grid gap-3 p-4">
        <div><span className="text-xs text-white/45">{record.specialty}</span><h3 className="text-lg font-semibold">{record.name}</h3></div>
        <p className="m-0 text-xs leading-relaxed text-white/50">{record.availability}</p>
        {unavailable ? <Notice tone="warning">Tarifa no disponible para cotizar.</Notice> : (
          <div className="flex flex-wrap gap-2" aria-label={`Tarifa de ${record.name}`}>
            {rates.map((rate) => (
              <button className="rounded-full border border-white/12 px-3 py-2 text-xs text-white/60 transition-colors aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-black focus-visible:outline-2 focus-visible:outline-white" key={rate.unit} type="button" aria-pressed={selected?.rate.unit === rate.unit} disabled={!selected} onClick={() => onRateChange(rate)}>{rate.label} · {formatUsd(rate.value)}{rate.negotiable ? "*" : ""}</button>
            ))}
          </div>
        )}
        <Button className="w-full" disabled={unavailable} variant={selected ? "secondary" : "primary"} onClick={onToggle}>{selected ? "Quitar" : "Seleccionar"}</Button>
      </div>
    </article>
  );
}

function LocationCatalog({ catalog, availability, cities, cityId, geographyError, provinceId, provinces, query, selected, onAvailabilityChange, onCityChange, onProvinceChange, onQueryChange, onClear, onSelect }) {
  return (
    <div className="grid gap-4">
      <TextField aria-label="Buscar locación para la cotización" placeholder="Buscar locación" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      <CollapsibleFilters activeCount={[availability, provinceId, cityId].filter(Boolean).length} contentClassName="grid gap-3 p-4 sm:grid-cols-3">
        <SelectField label="Provincia" value={provinceId} onChange={(event) => onProvinceChange(event.target.value)}><option value="">Todas</option>{provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        <SelectField disabled={!provinceId} label="Ciudad" value={cityId} onChange={(event) => onCityChange(event.target.value)}><option value="">Todas</option>{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        <TextField label="Disponibilidad" value={availability} onChange={(event) => onAvailabilityChange(event.target.value)} />
      </CollapsibleFilters>
      {geographyError && <Notice tone="warning">{geographyError}</Notice>}
      <CatalogLoadState {...catalog} hasMore={false} onLoadMore={catalog.loadMore} />
      {catalog.loading ? <LoadingSkeletons label="Cargando locaciones" variant="choice" /> : catalog.error ? null : catalog.records.length === 0 ? <EmptyState message="No encontramos locaciones con esos filtros." /> : <div className="grid gap-3 sm:grid-cols-2" aria-busy={catalog.loadingMore || undefined}>
        {catalog.records.map((record) => {
          const unavailable = !canQuoteLocation(record);
          const isSelected = selected?.id === record.id;
          return <article className={`grid overflow-hidden rounded-2xl bg-white/4 transition-colors ${isSelected ? "ring-2 ring-white/55" : "hover:bg-white/7"}`} key={record.id}><ResourceImage record={record} /><div className="grid gap-3 p-4"><div><span className="text-xs text-white/45">{[record.cityName, record.provinceName].filter(Boolean).join(", ")}</span><h3 className="text-lg font-semibold">{record.name}</h3></div><p className="m-0 text-xs text-white/50">{record.availability}</p><strong className="text-sm">{unavailable ? "Tarifa no disponible" : `${formatUsd(record.hourlyBudget)} / hora${record.hourlyBudgetNegotiable ? " · negociable" : ""}`}</strong><Button className="w-full" disabled={unavailable} variant={isSelected ? "secondary" : "primary"} onClick={() => isSelected ? onClear() : onSelect(record)}>{isSelected ? "Quitar locación" : "Elegir locación"}</Button></div></article>;
        })}
        {catalog.loadingMore && <LoadingSkeletons className="is-inline" count={2} label="Cargando más locaciones" variant="choice" />}
      </div>}
      {catalog.hasMore && !catalog.loading && <Button className="mx-auto" variant="secondary" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{catalog.loadingMore ? "Cargando…" : "Ver más"}</Button>}
    </div>
  );
}

function SelectionSummary({ casting, location, onRemoveCasting, onRemoveLocation }) {
  return <div className="grid gap-6"><div><span className="text-xs font-bold tracking-wide text-white/40 uppercase">Casting ({casting.length})</span><div className="mt-3 grid gap-2">{casting.length ? casting.map((item) => <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-white/5 p-3" key={item.id}><span className="min-w-0"><strong className="block truncate text-sm">{item.name}</strong><small className="text-white/45">{item.rate.unit === QUOTE_RATE_UNIT.HOURLY ? "Hora" : "Jornada"} · {formatUsd(item.rate.value)}{item.rate.negotiable ? "*" : ""}</small></span><button className="size-8 rounded-full text-white/45 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white" type="button" aria-label={`Quitar ${item.name}`} onClick={() => onRemoveCasting(item.id)}>×</button></div>) : <p className="text-sm text-white/35">Sin perfiles elegidos.</p>}</div></div><div><span className="text-xs font-bold tracking-wide text-white/40 uppercase">Locación ({location ? 1 : 0})</span>{location ? <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-white/5 p-3"><span className="min-w-0"><strong className="block truncate text-sm">{location.name}</strong><small className="text-white/45">{formatUsd(location.rate.value)} / hora</small></span><button className="size-8 rounded-full text-white/45 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white" type="button" aria-label={`Quitar ${location.name}`} onClick={onRemoveLocation}>×</button></div> : <p className="mt-3 text-sm text-white/35">Sin locación elegida.</p>}</div><p className="text-xs leading-relaxed text-white/35">* Tarifa publicada como negociable. El total usa el valor mostrado como estimación.</p></div>;
}
