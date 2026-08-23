import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuoteResourceExplorer } from "../../src/presentation/features/quotes/QuoteResourceExplorer.jsx";

const CASTING = {
  id: "casting-ana",
  name: "Ana Torres",
  specialty: "Actriz comercial",
  availability: "Tardes",
  imageUrl: "/ana.jpg",
  rates: {
    hourly: { value: 20, negotiable: true },
    daily: { value: 120, negotiable: false },
  },
};

const LOCATION = {
  id: "location-loft",
  name: "Loft Urdesa",
  provinceName: "Guayas",
  cityName: "Guayaquil",
  availability: "08:00–18:00",
  imageUrl: "/loft.jpg",
  hourlyBudget: 45,
  hourlyBudgetNegotiable: false,
};

function service() {
  return {
    listCasting: vi.fn(async () => ({ records: [CASTING], hasMore: false, fallback: false })),
    listLocations: vi.fn(async () => ({ records: [LOCATION], hasMore: false, fallback: false })),
    getProvinces: vi.fn(async () => [{ id: "guayas", name: "Guayas" }]),
    getCities: vi.fn(async () => [{ id: "guayaquil", name: "Guayaquil" }]),
  };
}

afterEach(cleanup);

describe("explorador de recursos de cotización", () => {
  it("aplica casting, modalidad y una locación desde el borrador", async () => {
    const onApply = vi.fn();
    render(
      <QuoteResourceExplorer
        catalogService={service()}
        castingSelections={[]}
        locationSelection={null}
        onApply={onApply}
        onClose={() => {}}
      />,
    );

    await screen.findByRole("heading", { name: "Ana Torres" });
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar" }));
    fireEvent.click(screen.getByRole("button", { name: "Jornada · $120" }));
    fireEvent.click(screen.getByRole("tab", { name: "Locación · 0" }));
    await screen.findByRole("heading", { name: "Loft Urdesa" });
    fireEvent.click(screen.getByRole("button", { name: "Elegir locación" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar selección" }));

    expect(onApply).toHaveBeenCalledOnce();
    const applied = onApply.mock.calls[0][0];
    expect(applied.castingSelections[0]).toMatchObject({
      id: "casting-ana",
      name: "Ana Torres",
      rate: { unit: "DAILY", value: 120 },
    });
    expect(applied.locationSelection).toMatchObject({
      id: "location-loft",
      name: "Loft Urdesa",
      rate: { unit: "HOURLY", value: 45 },
    });
  });

  it("cancela sin publicar los cambios del borrador", async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <QuoteResourceExplorer
        catalogService={service()}
        castingSelections={[]}
        locationSelection={null}
        onApply={onApply}
        onClose={onClose}
      />,
    );

    await screen.findByRole("heading", { name: "Ana Torres" });
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("impide seleccionar perfiles sin tarifa numérica", async () => {
    const catalogService = service();
    catalogService.listCasting.mockResolvedValue({
      records: [{ ...CASTING, id: "casting-no-rate", name: "Perfil sin tarifa", rates: { hourly: null, daily: null } }],
      hasMore: false,
      fallback: false,
    });
    render(<QuoteResourceExplorer catalogService={catalogService} castingSelections={[]} locationSelection={null} onApply={() => {}} onClose={() => {}} />);

    await screen.findByRole("heading", { name: "Perfil sin tarifa" });
    expect(screen.getByRole("button", { name: "Seleccionar" }).disabled).toBe(true);
    expect(screen.getByText("Tarifa no disponible para cotizar.")).toBeTruthy();
  });

  it("permite añadir más de cuatro perfiles y actualiza el contador", async () => {
    const onApply = vi.fn();
    const catalogService = service();
    catalogService.listCasting.mockResolvedValue({
      records: Array.from({ length: 6 }, (_, index) => ({
        ...CASTING,
        id: `casting-${index + 1}`,
        name: `Perfil ${index + 1}`,
      })),
      hasMore: false,
      fallback: false,
    });
    render(<QuoteResourceExplorer catalogService={catalogService} castingSelections={[]} locationSelection={null} onApply={onApply} onClose={() => {}} />);

    await screen.findByRole("heading", { name: "Perfil 6" });
    screen.getAllByRole("button", { name: "Seleccionar" }).forEach((button) => fireEvent.click(button));
    expect(screen.getByRole("tab", { name: "Casting · 6" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar selección" }));

    expect(onApply.mock.calls[0][0].castingSelections).toHaveLength(6);
  });

  it("restaura el foco al cerrar con Escape", async () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return <><button type="button" onClick={() => setOpen(true)}>Abrir selector</button>{open && <QuoteResourceExplorer catalogService={service()} castingSelections={[]} locationSelection={null} onApply={() => {}} onClose={() => setOpen(false)} />}</>;
    }
    const React = await import("react");
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Abrir selector" });
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});
