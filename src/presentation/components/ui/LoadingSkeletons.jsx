import { classNames } from "./classNames.js";

const DEFAULT_COUNTS = Object.freeze({
  catalog: 6,
  choice: 4,
  admin: 6,
  moderation: 3,
  row: 5,
  profile: 1,
});

function Shape({ className = "" }) {
  return <span className={classNames("loading-skeleton-shape", className)} />;
}

function CatalogSkeleton({ compact = false }) {
  return (
    <article className={classNames("loading-skeleton-card", compact && "is-compact")}>
      <Shape className="loading-skeleton-media" />
      <div className="loading-skeleton-body">
        <div className="loading-skeleton-heading"><Shape className="is-avatar" /><div><Shape className="is-kicker" /><Shape className="is-title" /></div></div>
        <div className="loading-skeleton-pills"><Shape /><Shape /><Shape /></div>
        <Shape className="is-line" />
        <Shape className="is-line is-short" />
      </div>
    </article>
  );
}

function AdminSkeleton() {
  return (
    <article className="loading-skeleton-card is-admin">
      <Shape className="loading-skeleton-media" />
      <div className="loading-skeleton-body"><Shape className="is-kicker" /><Shape className="is-title" /><Shape className="is-line" /><Shape className="is-line is-short" /><div className="loading-skeleton-actions"><Shape /><Shape /></div></div>
    </article>
  );
}

function ModerationSkeleton() {
  return (
    <article className="loading-skeleton-moderation">
      <Shape className="loading-skeleton-media" />
      <div className="loading-skeleton-moderation-body">
        <div className="loading-skeleton-moderation-heading"><div><Shape className="is-kicker" /><Shape className="is-title" /><Shape className="is-line is-short" /></div><Shape className="is-badge" /></div>
        <div className="loading-skeleton-facts">{Array.from({ length: 6 }, (_, index) => <Shape key={index} />)}</div>
        <div className="loading-skeleton-actions"><Shape /><Shape /></div>
      </div>
    </article>
  );
}

function RowSkeleton() {
  return <article className="loading-skeleton-row"><Shape className="is-line" /><Shape className="is-small-field" /><Shape className="is-badge" /><Shape className="is-button" /></article>;
}

function ProfileSkeleton() {
  return <section className="loading-skeleton-profile"><div><Shape className="is-kicker" /><Shape className="is-title" /></div><Shape className="is-line" /></section>;
}

function skeletonFor(variant, index) {
  if (variant === "choice") return <CatalogSkeleton key={index} compact />;
  if (variant === "admin") return <AdminSkeleton key={index} />;
  if (variant === "moderation") return <ModerationSkeleton key={index} />;
  if (variant === "row") return <RowSkeleton key={index} />;
  if (variant === "profile") return <ProfileSkeleton key={index} />;
  return <CatalogSkeleton key={index} />;
}

export function LoadingSkeletons({
  className = "",
  count,
  label = "Cargando datos",
  variant = "catalog",
}) {
  const total = count ?? DEFAULT_COUNTS[variant] ?? 3;
  return (
    <div
      className={classNames("loading-skeleton-collection", `is-${variant}`, className)}
      role="status"
      aria-label={label}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <div className="loading-skeleton-layout" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => skeletonFor(variant, index))}
      </div>
    </div>
  );
}
