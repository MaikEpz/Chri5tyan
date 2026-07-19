export function ConfigSection({ title, index, children }) {
  return (
    <section className="config-card">
      <div className="config-title"><span>{index}</span><h3>{title}</h3></div>
      <div className="config-controls">{children}</div>
    </section>
  );
}

export function QuantityControl({ label, value, minimum, onChange }) {
  return (
    <div className="quantity-control">
      <div><span>{label}</span><small>Mínimo {minimum}</small></div>
      <div className="stepper">
        <button type="button" disabled={value <= minimum} onClick={() => onChange(value - 1)}>−</button>
        <strong>{value}</strong>
        <button type="button" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export function ToggleControl({ label, hint, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}<small>{hint}</small></span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

export function SummaryRow({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
