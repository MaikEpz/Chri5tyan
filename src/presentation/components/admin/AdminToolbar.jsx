import { Button } from "../ui/Button.jsx";
import { CollapsibleFilters } from "../ui/CollapsibleFilters.jsx";
import { SelectField } from "../ui/SelectField.jsx";
import { TextField } from "../ui/TextField.jsx";

export function AdminToolbar({ query, active, additionalActiveCount = 0, children, onQueryChange, onActiveChange, onCreate, createLabel }) {
  const activeCount = Number(Boolean(query.trim())) + Number(Boolean(active)) + additionalActiveCount;

  return (
    <section className="my-6 grid gap-3">
      <Button className="justify-self-end" onClick={onCreate}>＋ {createLabel}</Button>
      <CollapsibleFilters
        activeCount={activeCount}
        contentClassName="grid items-end gap-4 p-4 md:grid-cols-2"
      >
        <TextField label="Buscar" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} />
        <SelectField label="Visibilidad" value={active} onChange={(event) => onActiveChange(event.target.value)}>
          <option value="">Todos</option>
          <option value="true">Visibles</option>
          <option value="false">Ocultos</option>
        </SelectField>
        {children}
      </CollapsibleFilters>
    </section>
  );
}
