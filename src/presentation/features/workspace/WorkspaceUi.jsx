import { useState } from "react";
import { getCatalogImage } from "./catalogImages.js";

export function ViewIntro({ eyebrow, title, copy }) {
  return (
    <section className="workspace-intro">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
    </section>
  );
}

export function Tabs({ value, onChange, items, label }) {
  return (
    <div className="workspace-tabs" role="tablist" aria-label={label}>
      {items.map(([id, itemLabel]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
        >
          {itemLabel}
        </button>
      ))}
    </div>
  );
}

export function SearchPanel({
  placeholder,
  filters,
  emptyMessage,
  activeFilter,
  onFilterChange,
  query = "",
  onQueryChange,
  children,
}) {
  return (
    <section className="search-panel">
      <label className="search-field">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
        />
      </label>
      <div className="filter-row" aria-label="Filtros">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            data-selected={activeFilter === filter}
            onClick={() => onFilterChange?.(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      {children || (
        <div className="empty-state">
          <span aria-hidden="true">＋</span>
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

export function CatalogGrid({ records, emptyMessage }) {
  if (!records.length) {
    return (
      <div className="empty-state">
        <span aria-hidden="true">⌕</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="catalog-grid">
      {records.map((record) => <CatalogCard key={record.id} record={record} />)}
    </div>
  );
}

function CatalogCard({ record }) {
  const imageUrl = getCatalogImage(record.imageId);

  return (
    <article className="catalog-card">
      {imageUrl && (
        <img
          className="catalog-card-image"
          src={imageUrl}
          alt={`${record.name}, ${record.specialty}`}
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="catalog-card-heading">
        <div className="catalog-avatar" aria-hidden="true">{record.initials}</div>
        <div>
          <span>{record.specialty}</span>
          <h2>{record.name}</h2>
        </div>
        <small>Ejemplo</small>
      </div>
      <ul>
        {record.details.map((detail) => <li key={detail}>{detail}</li>)}
      </ul>
      <div className="catalog-card-footer">
        <p><span>Disponibilidad</span>{record.availability}</p>
        <strong>{record.budget}</strong>
      </div>
      <button type="button">Ver detalles →</button>
    </article>
  );
}

export function RegistrationForm({ children, submitLabel }) {
  return (
    <form className="registration-form" onSubmit={(event) => event.preventDefault()}>
      {children}
      <button className="primary-action form-submit" type="submit">{submitLabel}</button>
    </form>
  );
}

export function FormField({
  label,
  type = "text",
  placeholder,
  options,
  wide = false,
}) {
  return (
    <label className={`form-field${wide ? " is-wide" : ""}`}>
      <span>{label}</span>
      {options ? (
        <select>{options.map((option) => <option key={option}>{option}</option>)}</select>
      ) : (
        <input type={type} placeholder={placeholder} />
      )}
    </label>
  );
}

export function ImageField({ label, hint }) {
  const [fileCount, setFileCount] = useState(0);
  return (
    <label className="form-field file-field">
      <span>{label}<small>{hint}</small></span>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => setFileCount(Math.min(event.target.files.length, 5))}
      />
      <strong>
        {fileCount
          ? `${fileCount} archivo${fileCount > 1 ? "s" : ""}`
          : "Seleccionar imágenes"}
      </strong>
    </label>
  );
}
