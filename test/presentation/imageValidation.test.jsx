import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CastingView } from "../../src/presentation/features/casting/CastingView.jsx";
import { LocationsView } from "../../src/presentation/features/locations/LocationsView.jsx";
import { AdminEquipmentView } from "../../src/presentation/features/admin/AdminEquipmentView.jsx";
import { ApiError } from "../../src/infrastructure/http/ApiClient.js";

function dummyFile(name = "test.jpg") {
  return new File(["content"], name, { type: "image/jpeg", lastModified: 1 });
}

function mockCatalogService() {
  return {
    getCastingCatalogs: vi.fn().mockResolvedValue({
      sexes: [{ id: "sex-f", name: "Femenino", active: true, displayOrder: 10 }],
      skinTones: [{ id: "skin-1", name: "Medio", active: true, displayOrder: 10 }],
      cultures: [{ id: "culture-1", name: "Mestiza", active: true, displayOrder: 10 }],
    }),
    listCasting: vi.fn().mockResolvedValue({ records: [], hasMore: false, fallback: false }),
    listLocations: vi.fn().mockResolvedValue({ records: [], hasMore: false, fallback: false }),
    listEquipmentAdmin: vi.fn().mockResolvedValue({ records: [], hasMore: false, fallback: false }),
    createCasting: vi.fn().mockResolvedValue({ id: "casting-1" }),
    createLocation: vi.fn().mockResolvedValue({ id: "loc-1" }),
    createEquipment: vi.fn().mockResolvedValue({ id: "eq-1" }),
    updateEquipment: vi.fn().mockResolvedValue({ id: "eq-1" }),
    getProvinces: vi.fn().mockReturnValue([{ id: "p1", name: "Pichincha" }]),
    getCities: vi.fn().mockReturnValue([{ id: "c1", name: "Quito" }]),
  };
}

beforeEach(() => {
  let counter = 0;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => `blob:test-${counter += 1}`),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Validación de 1 a 5 fotos en Casting", () => {
  it("muestra error si se intenta registrar sin adjuntar fotos", async () => {
    const service = mockCatalogService();
    render(<CastingView catalogService={service} runProtected={(fn) => fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Registrar actor" }));
    fireEvent.click(await screen.findByLabelText("Mestiza"));
    const submitBtn = screen.getByRole("button", { name: "Guardar perfil" });
    fireEvent.submit(submitBtn.closest("form"));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Debe subir al menos 1 foto y máximo 5 fotos");
    expect(service.createCasting).not.toHaveBeenCalled();
  });

  it("permite el envío cuando se incluye 1 foto", async () => {
    const service = mockCatalogService();
    render(<CastingView catalogService={service} runProtected={(fn) => fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Registrar actor" }));
    fireEvent.click(await screen.findByLabelText("Mestiza"));
    fireEvent.change(screen.getByLabelText("Seleccionar imágenes"), {
      target: { files: [dummyFile("foto1.jpg")] },
    });

    const submitBtn = screen.getByRole("button", { name: "Guardar perfil" });
    fireEvent.submit(submitBtn.closest("form"));

    await waitFor(() => expect(service.createCasting).toHaveBeenCalledOnce());
  });

  it("despliega el error retornado por el backend ante fallo de almacenamiento HTTP", async () => {
    const service = mockCatalogService();
    service.createCasting.mockRejectedValue(
      new ApiError("Debe subir al menos 1 foto y máximo 5 fotos", { status: 422, code: "STORAGE_ERROR" })
    );
    render(<CastingView catalogService={service} runProtected={(fn) => fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Registrar actor" }));
    fireEvent.click(await screen.findByLabelText("Mestiza"));
    fireEvent.change(screen.getByLabelText("Seleccionar imágenes"), {
      target: { files: [dummyFile("foto1.jpg")] },
    });

    const submitBtn = screen.getByRole("button", { name: "Guardar perfil" });
    fireEvent.submit(submitBtn.closest("form"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Debe subir al menos 1 foto y máximo 5 fotos");
  });
});

describe("Validación de 1 a 5 fotos en Locaciones", () => {
  it("muestra error en cliente al enviar formulario sin fotos de la locación", async () => {
    const service = mockCatalogService();
    render(<LocationsView catalogService={service} runProtected={(fn) => fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Registrar locación" }));
    const submitBtn = screen.getByRole("button", { name: "Enviar registro" });
    fireEvent.submit(submitBtn.closest("form"));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Debe subir al menos 1 foto y máximo 5 fotos");
    expect(service.createLocation).not.toHaveBeenCalled();
  });

  it("envía si la tarifa por hora es negociable", async () => {
    const service = mockCatalogService();
    render(<LocationsView catalogService={service} runProtected={(fn) => fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Registrar locación" }));
    fireEvent.click(screen.getByLabelText("Tarifa por hora negociable"));
    fireEvent.change(screen.getByLabelText("Seleccionar imágenes"), {
      target: { files: [dummyFile("locacion.jpg")] },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Enviar registro" }).closest("form"));

    await waitFor(() => expect(service.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({ hourlyBudgetNegotiable: true }),
      expect.any(Array),
    ));
  });
});

describe("Validación de 1 a 5 fotos en Administración de Equipos", () => {
  it("bloquea creación de equipo si no se incluye al menos 1 foto", async () => {
    const service = mockCatalogService();
    render(<AdminEquipmentView catalogService={service} />);

    fireEvent.click(screen.getByRole("button", { name: /Nuevo equipo/ }));
    const submitBtn = screen.getByRole("button", { name: "Guardar equipo" });
    fireEvent.submit(submitBtn.closest("form"));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Debe subir al menos 1 foto y máximo 5 fotos");
    expect(service.createEquipment).not.toHaveBeenCalled();
  });
});
