import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminModerationView } from "../../src/presentation/features/admin/AdminModerationView.jsx";

const CASTING_PENDING = {
  id: "casting-1",
  kind: "casting",
  fullName: "Ana Torres",
  age: 27,
  sex: { id: "sex-f", name: "Femenino" },
  heightCm: 168,
  skinTone: { id: "skin-1", name: "Trigueño" },
  cultures: [{ id: "culture-1", name: "Mestiza" }],
  experience: "Publicidad y cine",
  availability: "Fines de semana",
  rates: { currency: "USD", hourly: null, daily: { value: 120, negotiable: true } },
  status: "PENDING",
  rejectionReason: null,
  media: [],
  createdAt: "2026-08-09T12:00:00Z",
};

const LOCATION_PENDING = {
  id: "location-1",
  kind: "location",
  name: "Casa del Río",
  address: "Av. Principal 123",
  city: "Guayaquil",
  description: "Casa amplia con jardín",
  availability: "08:00–18:00",
  hourlyBudget: 80,
  hourlyBudgetNegotiable: true,
  status: "PENDING",
  rejectionReason: null,
  media: [],
  createdAt: "2026-08-09T13:00:00Z",
};

function page(records, hasMore = false) {
  return {
    records,
    hasMore,
    page: 0,
    totalElements: records.length,
    totalPages: hasMore ? 2 : 1,
  };
}

afterEach(cleanup);

describe("AdminModerationView", () => {
  it("carga pendientes y aprueba después de confirmar", async () => {
    let approved = false;
    const catalogService = {
      listCastingModeration: vi.fn(async () => page(approved ? [] : [CASTING_PENDING])),
      listLocationsModeration: vi.fn(async () => page([])),
      moderateCasting: vi.fn(async () => {
        approved = true;
      }),
      moderateLocation: vi.fn(),
    };

    render(<AdminModerationView catalogService={catalogService} />);
    const heading = await screen.findByRole("heading", { name: "Ana Torres" });
    const moderationCard = heading.closest("article");
    expect(moderationCard.classList.contains("admin-moderation-card")).toBe(true);
    expect(moderationCard.parentElement.classList.contains("admin-moderation-grid")).toBe(true);
    expect(catalogService.listCastingModeration).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING", page: 0, size: 20 }),
      expect.any(AbortSignal),
    );

    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprobación" }));

    await waitFor(() => expect(catalogService.moderateCasting).toHaveBeenCalledWith(
      "casting-1",
      { status: "APPROVED", reason: null },
    ));
    expect(await screen.findByText("Ana Torres fue aprobado.")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryAllByRole("heading", { name: "Ana Torres" })).toHaveLength(0);
    });
  });

  it("exige un motivo para rechazar y envía el texto normalizado", async () => {
    let rejected = false;
    const catalogService = {
      listCastingModeration: vi.fn(async () => page(rejected ? [] : [CASTING_PENDING])),
      listLocationsModeration: vi.fn(async () => page([])),
      moderateCasting: vi.fn(async () => {
        rejected = true;
      }),
      moderateLocation: vi.fn(),
    };

    render(<AdminModerationView catalogService={catalogService} />);
    await screen.findByRole("heading", { name: "Ana Torres" });
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));

    const confirmation = screen.getByRole("button", { name: "Confirmar rechazo" });
    expect(confirmation.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Motivo del rechazo"), {
      target: { value: "  La fotografía principal está borrosa.  " },
    });
    expect(confirmation.disabled).toBe(false);
    fireEvent.click(confirmation);

    await waitFor(() => expect(catalogService.moderateCasting).toHaveBeenCalledWith(
      "casting-1",
      { status: "REJECTED", reason: "La fotografía principal está borrosa." },
    ));
  });

  it("cambia de recurso, filtra el historial y pagina resultados", async () => {
    const approvedCasting = {
      ...CASTING_PENDING,
      id: "casting-approved",
      fullName: "Carlos Aprobado",
      status: "APPROVED",
    };
    const secondCasting = {
      ...CASTING_PENDING,
      id: "casting-2",
      fullName: "Segundo Perfil",
    };
    const catalogService = {
      listCastingModeration: vi.fn(async (parameters) => {
        if (parameters.status === "APPROVED") return page([approvedCasting]);
        if (parameters.page === 1) return page([secondCasting]);
        return page([CASTING_PENDING], true);
      }),
      listLocationsModeration: vi.fn(async () => page([{
        ...LOCATION_PENDING,
        status: "APPROVED",
      }])),
      moderateCasting: vi.fn(),
      moderateLocation: vi.fn(),
    };

    render(<AdminModerationView catalogService={catalogService} />);
    await screen.findByRole("heading", { name: "Ana Torres" });
    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(await screen.findByRole("heading", { name: "Segundo Perfil" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Filtros de moderación/ }));
    fireEvent.click(screen.getByRole("button", { name: "Aprobados" }));
    expect(await screen.findByRole("heading", { name: "Carlos Aprobado" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Aprobar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Locaciones" }));
    expect(await screen.findByRole("heading", { name: "Casa del Río" })).toBeTruthy();
    expect(catalogService.listLocationsModeration).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPROVED" }),
      expect.any(AbortSignal),
    );
  });

  it("permite rechazar un casting que ya estaba aprobado", async () => {
    const approvedCasting = {
      ...CASTING_PENDING,
      status: "APPROVED",
    };
    const catalogService = {
      listCastingModeration: vi.fn(async () => page([approvedCasting])),
      listLocationsModeration: vi.fn(async () => page([])),
      moderateCasting: vi.fn().mockResolvedValue({}),
      moderateLocation: vi.fn(),
    };

    render(<AdminModerationView catalogService={catalogService} />);
    fireEvent.click(screen.getByRole("button", { name: /Filtros de moderación/ }));
    fireEvent.click(screen.getByRole("button", { name: "Aprobados" }));
    await screen.findByRole("heading", { name: "Ana Torres" });

    expect(screen.queryByRole("button", { name: "Aprobar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    fireEvent.change(screen.getByLabelText("Motivo del rechazo"), {
      target: { value: "El material dejó de cumplir los requisitos." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar rechazo" }));

    await waitFor(() => expect(catalogService.moderateCasting).toHaveBeenCalledWith(
      "casting-1",
      {
        status: "REJECTED",
        reason: "El material dejó de cumplir los requisitos.",
      },
    ));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Ana Torres" })).toBeNull();
    });
  });

  it("permite aprobar una locación que ya estaba rechazada", async () => {
    const rejectedLocation = {
      ...LOCATION_PENDING,
      status: "REJECTED",
      rejectionReason: "Fotografías incompletas",
    };
    const catalogService = {
      listCastingModeration: vi.fn(async () => page([])),
      listLocationsModeration: vi.fn(async () => page([rejectedLocation])),
      moderateCasting: vi.fn(),
      moderateLocation: vi.fn().mockResolvedValue({}),
    };

    render(<AdminModerationView catalogService={catalogService} />);
    fireEvent.click(screen.getByRole("button", { name: /Filtros de moderación/ }));
    fireEvent.click(screen.getByRole("tab", { name: "Locaciones" }));
    fireEvent.click(screen.getByRole("button", { name: "Rechazados" }));
    await screen.findByRole("heading", { name: "Casa del Río" });

    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprobación" }));

    await waitFor(() => expect(catalogService.moderateLocation).toHaveBeenCalledWith(
      "location-1",
      { status: "APPROVED", reason: null },
    ));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Casa del Río" })).toBeNull();
    });
  });

  it("mantiene el registro cuando el servidor rechaza la decisión", async () => {
    const catalogService = {
      listCastingModeration: vi.fn(async () => page([CASTING_PENDING])),
      listLocationsModeration: vi.fn(async () => page([])),
      moderateCasting: vi.fn().mockRejectedValue(new Error("No tienes permisos para moderar.")),
      moderateLocation: vi.fn(),
    };

    render(<AdminModerationView catalogService={catalogService} />);
    await screen.findByRole("heading", { name: "Ana Torres" });
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aprobación" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("No tienes permisos para moderar.")).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "Ana Torres" }).length).toBeGreaterThan(0);
  });

  it("aplica la búsqueda sin perder el filtro actual", async () => {
    const catalogService = {
      listCastingModeration: vi.fn(async () => page([])),
      listLocationsModeration: vi.fn(async () => page([])),
      moderateCasting: vi.fn(),
      moderateLocation: vi.fn(),
    };
    render(<AdminModerationView catalogService={catalogService} />);
    await screen.findByText("No hay registros para este filtro.");

    fireEvent.change(screen.getByLabelText("Buscar registros"), {
      target: { value: "  Ana  " },
    });

    await waitFor(() => expect(catalogService.listCastingModeration).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Ana", status: "PENDING" }),
      expect.any(AbortSignal),
    ));
  });
});
