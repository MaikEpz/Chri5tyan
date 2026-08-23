import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Notice } from "../../components/ui/Notice.jsx";
import { SelectField } from "../../components/ui/SelectField.jsx";
import { TextField } from "../../components/ui/TextField.jsx";
import { CatalogGrid } from "../../components/catalog/CatalogGrid.jsx";
import { ImageCarousel } from "../../components/catalog/ImageCarousel.jsx";
import { SearchPanel } from "../../components/catalog/SearchPanel.jsx";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { FormField } from "../../components/forms/FormField.jsx";
import { ImageField } from "../../components/forms/ImageField.jsx";
import { RegistrationForm } from "../../components/forms/RegistrationForm.jsx";
import { Tabs } from "../../components/layout/Tabs.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";

const PROFILE_STATUS = Object.freeze({
  PENDING: ["Pendiente", "Tu perfil está esperando revisión administrativa."],
  APPROVED: ["Aprobado", "Tu perfil está publicado en el catálogo."],
  REJECTED: ["Rechazado", "Corrige la información indicada y vuelve a enviarlo."],
});

function CurrentProfileMedia({ profile }) {
  if (!profile?.media?.length) return null;
  return (
    <section className="my-5 grid gap-4 rounded-chris-card bg-white/3 p-4" aria-label="Fotos actuales del perfil">
      <div className="grid gap-1">
        <strong className="text-sm text-white">Fotos actuales ({profile.media.length})</strong>
        <small className="text-xs text-chris-subtle">Se conservarán si no seleccionas archivos nuevos.</small>
      </div>
      <ImageCarousel images={profile.media} alt={`Foto actual 1 de ${profile.fullName}`} className="casting-profile-carousel" />
    </section>
  );
}

function RateOption({ children, description, enabled, onToggle, title }) {
  return (
    <section className={`grid content-start gap-4 rounded-xl border p-4 transition-colors ${enabled ? "border-white/25 bg-white/7" : "border-white/10 bg-black/15"}`}>
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="grid gap-1">
          <strong className="text-sm font-semibold text-white">{title}</strong>
          <small className="text-xs leading-relaxed text-chris-subtle">{description}</small>
        </span>
        <span className="relative inline-flex shrink-0">
          <input
            className="peer sr-only"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            type="checkbox"
          />
          <span className="h-6 w-11 rounded-full border border-white/15 bg-white/10 transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white/55 after:transition-transform after:content-[''] peer-checked:border-white peer-checked:bg-white peer-checked:after:translate-x-5 peer-checked:after:bg-chris-black peer-focus-visible:ring-2 peer-focus-visible:ring-white/35 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-chris-panel" aria-hidden="true" />
        </span>
      </label>
      {enabled && children}
    </section>
  );
}

function NegotiableRate({ defaultChecked, name }) {
  return (
    <label className="flex min-h-13 cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/15 px-3.5 py-3 text-sm text-chris-muted transition-colors hover:border-white/20">
      <span>Precio negociable</span>
      <span className="relative inline-flex shrink-0">
        <input className="peer sr-only" defaultChecked={defaultChecked} name={name} type="checkbox" />
        <span className="h-5 w-9 rounded-full border border-white/15 bg-white/10 transition-colors after:absolute after:left-1 after:top-1 after:h-3 after:w-3 after:rounded-full after:bg-white/55 after:transition-transform after:content-[''] peer-checked:border-white peer-checked:bg-white peer-checked:after:translate-x-4 peer-checked:after:bg-chris-black peer-focus-visible:ring-2 peer-focus-visible:ring-white/35 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-chris-panel" aria-hidden="true" />
      </span>
    </label>
  );
}

export function CastingView({ catalogService, runProtected, user = null }) {
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("");
  const [sexId, setSexId] = useState("");
  const [minAge, setMinAge] = useState("");
  const [skinToneId, setSkinToneId] = useState("");
  const [cultureId, setCultureId] = useState("");
  const [availability, setAvailability] = useState("");
  const [rateUnit, setRateUnit] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [catalogOptions, setCatalogOptions] = useState({ sexes: [], skinTones: [], cultures: [] });
  const [catalogOptionsError, setCatalogOptionsError] = useState("");
  const [hourlyEnabled, setHourlyEnabled] = useState(false);
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ownProfile, setOwnProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileRevision, setProfileRevision] = useState(0);

  const request = useCallback(
    (page, signal) => catalogService.listCasting({
      q: query.trim(),
      sexId: sexId || undefined,
      minAge: minAge || undefined,
      skinToneId: skinToneId || undefined,
      cultureId: cultureId || undefined,
      availability: availability.trim() || undefined,
      rateUnit: rateUnit || undefined,
      maxRate: rateUnit && maxRate ? maxRate : undefined,
      page,
      size: 12,
      sort: "createdAt,desc",
    }, signal),
    [availability, catalogService, cultureId, maxRate, minAge, query, rateUnit, sexId, skinToneId],
  );
  const catalog = useCatalogPage(request);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogOptionsError("");
    catalogService.getCastingCatalogs(controller.signal)
      .then(setCatalogOptions)
      .catch((loadError) => {
        if (loadError?.name !== "AbortError") setCatalogOptionsError(loadError?.message || "No se pudieron cargar los catálogos de casting.");
      });
    return () => controller.abort();
  }, [catalogService]);

  useEffect(() => {
    if (!user?.id) {
      setOwnProfile(null);
      setProfileLoading(false);
      setProfileError("");
      return undefined;
    }

    const controller = new AbortController();
    setProfileLoading(true);
    setProfileError("");
    catalogService.getMyCasting(controller.signal)
      .then(setOwnProfile)
      .catch((loadError) => {
        if (loadError?.name !== "AbortError") {
          setProfileError(loadError?.message || "No se pudo cargar tu perfil de casting.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setProfileLoading(false);
      });
    return () => controller.abort();
  }, [catalogService, profileRevision, user?.id]);

  useEffect(() => {
    setHourlyEnabled(Boolean(ownProfile?.rates?.hourly));
    setDailyEnabled(ownProfile ? Boolean(ownProfile.rates?.daily) : true);
  }, [ownProfile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = {
      fullName: values.get("fullName"),
      age: Number(values.get("age")),
      sexId: values.get("sexId"),
      heightCm: Number(values.get("heightCm")),
      skinToneId: values.get("skinToneId"),
      cultureIds: values.getAll("cultureIds"),
      experience: values.get("experience"),
      availability: values.get("availability"),
      rates: {
        hourly: hourlyEnabled ? {
          value: Number(values.get("hourlyRate")),
          negotiable: values.get("hourlyNegotiable") === "on",
        } : null,
        daily: dailyEnabled ? {
          value: Number(values.get("dailyRate")),
          negotiable: values.get("dailyNegotiable") === "on",
        } : null,
      },
    };
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!hourlyEnabled && !dailyEnabled) {
        setError("Indica una tarifa por hora, por jornada o ambas.");
        return;
      }
      if (payload.cultureIds.length === 0) {
        setError("Selecciona al menos una cultura.");
        return;
      }
      if (ownProfile) {
        if (images.length > 5) {
          setError("Se permiten máximo 5 fotos");
          return;
        }
        if (images.length === 0 && (!ownProfile.media || ownProfile.media.length === 0)) {
          setError("Debe mantener al menos 1 foto y máximo 5 fotos");
          return;
        }
        await runProtected(() => catalogService.updateCasting(ownProfile.id, payload, images));
        setMessage("Perfil actualizado. Volvió a quedar pendiente de aprobación.");
        setProfileLoading(true);
      } else {
        if (images.length < 1) {
          setError("Debe subir al menos 1 foto y máximo 5 fotos");
          return;
        }
        if (images.length > 5) {
          setError("Se permiten máximo 5 fotos");
          return;
        }
        await runProtected(() => catalogService.createCasting(payload, images));
        setMessage("Perfil enviado. Quedará visible cuando sea aprobado.");
        form.reset();
      }
      setImages([]);
      setFormKey((value) => value + 1);
      setProfileRevision((value) => value + 1);
    } catch (submitError) {
      if (submitError?.code !== "AUTH_CANCELLED") {
        setError(submitError?.message || "No se pudo enviar el perfil.");
      }
    } finally {
      setBusy(false);
    }
  };

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
        items={[["search", "Buscar actores"], ["register", user ? "Mi perfil" : "Registrar actor"]]}
      />
      {catalogOptionsError && <Notice className="my-4" role="alert" tone="danger">{catalogOptionsError}</Notice>}
      {mode === "search" ? (
        <SearchPanel
          placeholder="Buscar por nombre o experiencia"
          filters={[]}
          activeFilterCount={[
            sexId,
            minAge,
            skinToneId,
            cultureId,
            availability,
            rateUnit,
            rateUnit ? maxRate : "",
          ].filter(Boolean).length}
          filterContent={(
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SelectField label="Sexo" value={sexId} onChange={(event) => setSexId(event.target.value)}>
                  <option value="">Todos</option>
                  {catalogOptions.sexes.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </SelectField>
              <TextField label="Edad mínima" min="18" type="number" value={minAge} onChange={(event) => setMinAge(event.target.value)} />
              <SelectField label="Tono de piel" value={skinToneId} onChange={(event) => setSkinToneId(event.target.value)}>
                <option value="">Todos</option>
                {catalogOptions.skinTones.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </SelectField>
              <SelectField label="Cultura" value={cultureId} onChange={(event) => setCultureId(event.target.value)}>
                <option value="">Todas</option>
                {catalogOptions.cultures.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </SelectField>
              <TextField label="Disponibilidad" value={availability} onChange={(event) => setAvailability(event.target.value)} />
              <SelectField label="Modalidad de tarifa" value={rateUnit} onChange={(event) => setRateUnit(event.target.value)}>
                <option value="">Cualquiera</option>
                <option value="HOURLY">Por hora</option>
                <option value="DAILY">Por jornada</option>
              </SelectField>
              <TextField label="Presupuesto máximo" min="0" step="0.01" type="number" disabled={!rateUnit} value={maxRate} onChange={(event) => setMaxRate(event.target.value)} />
            </div>
          )}
          query={query}
          onQueryChange={setQuery}
        >
          <CatalogGrid
            records={catalog.records}
            emptyMessage="No encontramos actores con esa búsqueda."
            error={catalog.error}
            loading={catalog.loading}
            loadingMore={catalog.loadingMore}
          />
          <CatalogLoadState {...catalog} onLoadMore={catalog.loadMore} />
        </SearchPanel>
      ) : user && profileLoading ? (
        <LoadingSkeletons label="Cargando tu perfil" variant="profile" />
      ) : user && profileError ? (
        <Notice className="grid justify-items-start gap-3" role="alert" tone="danger">
          <p className="m-0">{profileError}</p>
          <Button size="compact" type="button" onClick={() => setProfileRevision((value) => value + 1)}>
            Reintentar
          </Button>
        </Notice>
      ) : (
        <>
        {ownProfile && (
          <section className="my-5 grid gap-3 rounded-chris-card bg-white/3 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="grid gap-1">
              <span className="text-xs tracking-wide text-white/40 uppercase">Estado del perfil</span>
              <strong className="text-white">{PROFILE_STATUS[ownProfile.status]?.[0] || ownProfile.status}</strong>
            </div>
            <p className="m-0 text-sm text-chris-muted">{PROFILE_STATUS[ownProfile.status]?.[1]}</p>
            {ownProfile.status === "REJECTED" && ownProfile.rejectionReason && (
              <Notice className="sm:col-span-2" tone="danger"><strong>Motivo:</strong> {ownProfile.rejectionReason}</Notice>
            )}
          </section>
        )}
        <CurrentProfileMedia profile={ownProfile} />
        <RegistrationForm
          key={`${formKey}-${ownProfile?.id || "new"}`}
          busy={busy}
          error={error}
          message={message}
          submitLabel={ownProfile ? "Actualizar perfil" : "Guardar perfil"}
          onSubmit={handleSubmit}
        >
          <FormField label="Nombre completo" name="fullName" defaultValue={ownProfile?.fullName} required />
          <FormField label="Edad" name="age" type="number" min="18" max="100" defaultValue={ownProfile?.age} required />
          <FormField
            label="Sexo"
            name="sexId"
            required
            defaultValue={ownProfile?.sex?.id || ""}
            options={[["", "Seleccionar"], ...catalogOptions.sexes.map((option) => [option.id, option.name])]}
          />
          <FormField
            label="Altura"
            name="heightCm"
            type="number"
            min="100"
            max="230"
            placeholder="cm"
            defaultValue={ownProfile?.heightCm}
            required
          />
          <FormField label="Tono de piel" name="skinToneId" defaultValue={ownProfile?.skinTone?.id || ""} required options={[["", "Seleccionar"], ...catalogOptions.skinTones.map((option) => [option.id, option.name])]} />
          <fieldset className="col-span-full grid gap-3 rounded-xl bg-black/15 p-4">
            <legend className="px-2 text-sm text-chris-muted">Culturas</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {catalogOptions.cultures.map((option) => (
                <label className="flex items-center gap-2 text-sm text-white/70" key={option.id}>
                  <input defaultChecked={ownProfile?.cultures?.some((item) => item.id === option.id)} name="cultureIds" type="checkbox" value={option.id} />
                  {option.name}
                </label>
              ))}
            </div>
          </fieldset>
          <FormField label="Experiencia" name="experience" defaultValue={ownProfile?.experience} textarea wide required />
          <FormField label="Horarios disponibles" name="availability" defaultValue={ownProfile?.availability} textarea wide required />
          <fieldset className="col-span-full grid gap-4 rounded-xl bg-black/15 p-4">
            <legend className="px-2 text-sm text-chris-muted">Tarifas en USD</legend>
            <div className="grid items-start gap-3 lg:grid-cols-2">
              <RateOption
                description="Define el valor de una hora de trabajo."
                enabled={hourlyEnabled}
                onToggle={setHourlyEnabled}
                title="Tarifa por hora"
              >
                <div className="grid gap-3">
                  <FormField label="Valor por hora" name="hourlyRate" type="number" min="0" step="0.01" defaultValue={ownProfile?.rates?.hourly?.value} required />
                  <NegotiableRate defaultChecked={ownProfile?.rates?.hourly?.negotiable} name="hourlyNegotiable" />
                </div>
              </RateOption>
              <RateOption
                description="Define el valor de una jornada completa."
                enabled={dailyEnabled}
                onToggle={setDailyEnabled}
                title="Tarifa por jornada"
              >
                <div className="grid gap-3">
                  <FormField label="Valor por jornada" name="dailyRate" type="number" min="0" step="0.01" defaultValue={ownProfile?.rates?.daily?.value} required />
                  <NegotiableRate defaultChecked={ownProfile?.rates?.daily?.negotiable} name="dailyNegotiable" />
                </div>
              </RateOption>
            </div>
          </fieldset>
          <ImageField
            label="Fotos"
            hint={ownProfile
              ? "Opcional: al elegir nuevas (1 a 5 fotos), reemplazarás las actuales"
              : "Requerido: Mínimo 1, máximo 5 fotos (JPEG, PNG o WebP)"}
            files={images}
            onFilesChange={setImages}
          />
        </RegistrationForm>
        </>
      )}
    </div>
  );
}
