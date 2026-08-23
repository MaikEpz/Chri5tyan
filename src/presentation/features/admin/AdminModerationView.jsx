import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { classNames } from "../../components/ui/classNames.js";
import { CollapsibleFilters } from "../../components/ui/CollapsibleFilters.jsx";
import { Dialog } from "../../components/ui/Dialog.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { FilterPills } from "../../components/ui/FilterPills.jsx";
import { Notice } from "../../components/ui/Notice.jsx";
import { TextField } from "../../components/ui/TextField.jsx";
import { ImageCarousel } from "../../components/catalog/ImageCarousel.jsx";
import { CatalogLoadState, useCatalogPage } from "../../components/catalog/useCatalogPage.jsx";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";
import { Tabs } from "../../components/layout/Tabs.jsx";
import { ViewIntro } from "../../components/layout/ViewIntro.jsx";

const RESOURCE_TABS = Object.freeze([
  ["casting", "Casting"],
  ["location", "Locaciones"],
]);

const STATUS_FILTERS = Object.freeze([
  ["PENDING", "Pendientes"],
  ["APPROVED", "Aprobados"],
  ["REJECTED", "Rechazados"],
  ["", "Todos"],
]);

const STATUS_LABELS = Object.freeze({
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
});

const STATUS_STYLES = Object.freeze({
  PENDING: "border-amber-300/20 bg-amber-300/8 text-amber-100",
  APPROVED: "border-lime-300/20 bg-lime-300/8 text-lime-100",
  REJECTED: "border-red-300/20 bg-red-300/8 text-red-100",
});

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "short",
});

const moneyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

function formatDate(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : dateFormatter.format(date);
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function formatRate(rate, unit) {
  if (!rate) return null;
  return `${formatMoney(rate.value)} / ${unit}${rate.negotiable ? " · Negociable" : ""}`;
}

function recordTitle(record) {
  return record.kind === "casting" ? record.fullName : record.name;
}

function recordFacts(record) {
  if (record.kind === "casting") {
    return [
      ["Edad", `${record.age} años`],
      ["Sexo", record.sex?.name],
      ["Altura", `${record.heightCm} cm`],
      ["Tono de piel", record.skinTone?.name],
      ["Culturas", record.cultures?.map((item) => item.name).join(", ")],
      ["Experiencia", record.experience],
      ["Disponibilidad", record.availability],
      ["Tarifa por hora", formatRate(record.rates?.hourly, "hora")],
      ["Tarifa por jornada", formatRate(record.rates?.daily, "jornada")],
    ];
  }

  return [
    ["Dirección", record.address],
    ["Provincia", record.provinceName || record.provinceId || "—"],
    ["Ciudad", record.cityName || record.city],
    ["Descripción", record.description],
    ["Disponibilidad", record.availability],
    ["Presupuesto por hora", `${formatMoney(record.hourlyBudget)}${record.hourlyBudgetNegotiable ? " · Negociable" : ""}`],
  ];
}

function ModerationCard({ record, onApprove, onReject }) {
  const title = recordTitle(record);
  return (
    <article className="admin-moderation-card group grid min-w-0 overflow-hidden rounded-chris-card bg-white/3 p-3 transition-colors duration-300 hover:bg-white/6">
      {record.media.length > 0 ? (
        <ImageCarousel images={record.media} alt={title} />
      ) : (
        <div className="grid aspect-[16/9.5] place-items-center rounded-xl bg-black/20 px-4 text-center text-xs text-white/40">Este registro no contiene archivos.</div>
      )}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="truncate text-xs tracking-wide text-white/40 uppercase">{record.kind === "casting" ? "Perfil de casting" : "Locación"}</span>
          <h2 className="m-0 truncate text-lg font-semibold text-white">{title}</h2>
          <small className="truncate text-[0.68rem] text-white/40">Enviado el {formatDate(record.createdAt)}</small>
        </div>
        <strong className={classNames("rounded-full border px-2.5 py-1.5 text-[0.68rem]", STATUS_STYLES[record.status] || "border-white/10 text-white/60")}>
          {STATUS_LABELS[record.status] || record.status}
        </strong>
      </div>

      <dl className="my-4 grid grid-cols-2 gap-2 overflow-hidden">
        {recordFacts(record).map(([label, value]) => (
          <div className={classNames("grid min-w-0 gap-1 rounded-lg bg-black/15 p-2.5", ["Dirección", "Descripción", "Culturas", "Experiencia", "Disponibilidad"].includes(label) && "col-span-2")} key={label}>
            <dt className="text-[0.65rem] tracking-wide text-white/35 uppercase">{label}</dt>
            <dd className="m-0 break-words text-xs leading-relaxed text-white/75">{value || "No especificado"}</dd>
          </div>
        ))}
      </dl>

      {record.status === "REJECTED" && record.rejectionReason && (
        <Notice tone="danger"><strong className="block">Motivo del rechazo</strong><p className="m-0 mt-1">{record.rejectionReason}</p></Notice>
      )}

      <div className="mt-auto flex flex-wrap justify-end gap-2 pt-2">
        {record.status !== "REJECTED" && (
          <Button size="compact" variant="danger" onClick={() => onReject(record)}>
            Rechazar
          </Button>
        )}
        {record.status !== "APPROVED" && (
          <Button size="compact" onClick={() => onApprove(record)}>
            Aprobar
          </Button>
        )}
      </div>
    </article>
  );
}

function ModerationDialog({ decision, busy, error, reason, onReasonChange, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const isRejecting = decision?.type === "reject";
  const title = decision ? recordTitle(decision.record) : "";

  useEffect(() => {
    if (!decision) return undefined;
    dialogRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, decision, onCancel]);

  if (!decision) return null;

  return (
    <Dialog ref={dialogRef} className="max-w-xl p-6" labelledBy="moderation-dialog-title" tabIndex="-1">
        <span className="text-xs font-bold tracking-[0.16em] text-chris-accent uppercase">{isRejecting ? "Rechazar registro" : "Aprobar registro"}</span>
        <h2 className="my-2 text-2xl font-semibold" id="moderation-dialog-title">{title}</h2>
        {isRejecting ? (
          <TextField
            className="mt-5"
            label="Motivo del rechazo"
            hint={`${reason.length}/500`}
            multiline
            aria-label="Motivo del rechazo"
            autoFocus
            maxLength="500"
            required
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Explica qué debe corregirse antes de volver a enviarlo."
          />
        ) : (
          <p className="text-chris-muted">El registro quedará visible inmediatamente en el catálogo público.</p>
        )}
        {error && <Notice className="mt-4" role="alert" tone="danger">{error}</Notice>}
        <div className="mt-5 flex flex-wrap justify-end gap-3 pt-2">
          <Button disabled={busy} variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button
            variant={isRejecting ? "danger" : "primary"}
            disabled={busy || (isRejecting && !reason.trim())}
            onClick={onConfirm}
          >
            {busy ? "Guardando…" : isRejecting ? "Confirmar rechazo" : "Confirmar aprobación"}
          </Button>
        </div>
    </Dialog>
  );
}

export function AdminModerationView({
  catalogService,
  initialResource = "casting",
  hideResourceTabs = false,
}) {
  const [resource, setResource] = useState(initialResource);
  const [status, setStatus] = useState("PENDING");
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState("");
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [localDecisions, setLocalDecisions] = useState(() => new Map());

  const request = useCallback(
    (page, signal) => {
      const parameters = {
        q: query.trim() || undefined,
        status: status || undefined,
        page,
        size: 20,
        sort: "createdAt,desc",
      };
      return resource === "casting"
        ? catalogService.listCastingModeration(parameters, signal)
        : catalogService.listLocationsModeration(parameters, signal);
    },
    [catalogService, query, resource, revision, status],
  );
  const catalog = useCatalogPage(request);

  const openDecision = (type, record) => {
    setDecision({ type, record });
    setReason("");
    setModerationError("");
    setFeedback("");
  };

  const closeDecision = useCallback(() => {
    if (moderating) return;
    setDecision(null);
    setReason("");
    setModerationError("");
  }, [moderating]);

  const confirmDecision = async () => {
    if (!decision) return;
    const rejecting = decision.type === "reject";
    const normalizedReason = reason.trim();
    if (rejecting && !normalizedReason) {
      setModerationError("Escribe el motivo del rechazo.");
      return;
    }

    const payload = {
      status: rejecting ? "REJECTED" : "APPROVED",
      reason: rejecting ? normalizedReason : null,
    };
    setModerating(true);
    setModerationError("");
    try {
      if (decision.record.kind === "casting") {
        await catalogService.moderateCasting(decision.record.id, payload);
      } else {
        await catalogService.moderateLocation(decision.record.id, payload);
      }
      setFeedback(`${recordTitle(decision.record)} fue ${rejecting ? "rechazado" : "aprobado"}.`);
      setLocalDecisions((current) => new Map(current).set(decision.record.id, payload));
      setDecision(null);
      setReason("");
      setRevision((value) => value + 1);
    } catch (submitError) {
      setModerationError(submitError?.message || "No se pudo actualizar el registro.");
    } finally {
      setModerating(false);
    }
  };

  const visibleRecords = catalog.records
    .map((record) => {
      const localDecision = localDecisions.get(record.id);
      return localDecision
        ? {
          ...record,
          status: localDecision.status,
          rejectionReason: localDecision.reason,
        }
        : record;
    })
    .filter((record) => (
      record.kind === resource && (!status || record.status === status)
    ));

  return (
    <div className="workspace-view">
      <ViewIntro
        eyebrow="Administración"
        title="Moderación de registros"
        copy="Revisa la información enviada antes de publicarla en el catálogo."
      />
      {!hideResourceTabs && (
        <Tabs
          label="Tipo de registro"
          value={resource}
          onChange={(value) => {
            setResource(value);
            setFeedback("");
          }}
          items={RESOURCE_TABS}
        />
      )}

      <CollapsibleFilters
        activeCount={Number(Boolean(query.trim())) + Number(Boolean(status))}
        className="my-6"
        contentClassName="grid gap-4 p-4 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end"
        label="Filtros de moderación"
      >
        <TextField label="Buscar registros" type="search" placeholder={resource === "casting" ? "Nombre del actor" : "Nombre o ciudad"} value={query} onChange={(event) => setQuery(event.target.value)} />
        <FilterPills label="Estado" items={STATUS_FILTERS} value={status} onChange={(value) => { setStatus(value); setFeedback(""); }} />
      </CollapsibleFilters>

      {feedback && <Notice className="my-4" tone="success">{feedback}</Notice>}
      {catalog.error && <CatalogLoadState {...catalog} hasMore={false} onLoadMore={catalog.loadMore} />}

      {!catalog.loading && visibleRecords.length === 0 && !catalog.error && (
        <EmptyState icon="✓" message="No hay registros para este filtro." />
      )}

      {catalog.loading ? <LoadingSkeletons label="Cargando registros de moderación" variant="moderation" /> : <div className="admin-moderation-grid grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={catalog.loadingMore || undefined}>
        {visibleRecords.map((record) => (
          <ModerationCard
            key={record.id}
            record={record}
            onApprove={(selected) => openDecision("approve", selected)}
            onReject={(selected) => openDecision("reject", selected)}
          />
        ))}
        {catalog.loadingMore && <LoadingSkeletons className="is-inline" count={3} label="Cargando más registros" variant="moderation" />}
      </div>}
      {!catalog.error && <CatalogLoadState {...catalog} onLoadMore={catalog.loadMore} />}

      <ModerationDialog
        decision={decision}
        busy={moderating}
        error={moderationError}
        reason={reason}
        onReasonChange={setReason}
        onCancel={closeDecision}
        onConfirm={confirmDecision}
      />
    </div>
  );
}
