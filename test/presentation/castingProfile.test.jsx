import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CastingView } from "../../src/presentation/features/casting/CastingView.jsx";

const USER = {
  id: "user-1",
  fullName: "Cuenta Cliente",
  role: "CLIENT",
};
const CASTING_CATALOGS = {
  sexes: [{ id: "sex-f", name: "Femenino", active: true, displayOrder: 10 }, { id: "sex-m", name: "Masculino", active: true, displayOrder: 20 }],
  skinTones: [{ id: "skin-1", name: "Trigueño", active: true, displayOrder: 10 }],
  cultures: [{ id: "culture-1", name: "Mestiza", active: true, displayOrder: 10 }],
};

const OWN_PROFILE = {
  id: "casting-own",
  kind: "casting",
  fullName: "Ana Torres",
  age: 28,
  sex: CASTING_CATALOGS.sexes[0],
  heightCm: 168,
  skinTone: CASTING_CATALOGS.skinTones[0],
  cultures: CASTING_CATALOGS.cultures,
  experience: "Publicidad",
  availability: "Fines de semana",
  rates: { currency: "USD", hourly: null, daily: { value: 125, negotiable: false } },
  status: "APPROVED",
  rejectionReason: null,
  media: [{
    id: "media-1",
    url: "https://api.example.com/media/1",
    contentType: "image/jpeg",
    sortOrder: 0,
  }],
};

function emptyCatalog() {
  return { records: [], hasMore: false, fallback: false };
}

function serviceWithProfile(profile = OWN_PROFILE) {
  return {
    listCasting: vi.fn(async () => emptyCatalog()),
    getCastingCatalogs: vi.fn(async () => CASTING_CATALOGS),
    getMyCasting: vi.fn(async () => profile),
    createCasting: vi.fn().mockResolvedValue({}),
    updateCasting: vi.fn().mockResolvedValue({}),
  };
}

beforeEach(() => {
  let preview = 0;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => `blob:casting-${preview += 1}`),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("perfil de casting propio", () => {
  it("muestra el perfil existente precargado y no ofrece registrarlo de nuevo", async () => {
    const catalogService = serviceWithProfile();
    render(
      <CastingView
        catalogService={catalogService}
        runProtected={(operation) => operation()}
        user={USER}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Mi perfil" }));

    expect(await screen.findByRole("button", { name: "Actualizar perfil" })).toBeTruthy();
    expect(screen.getByLabelText("Nombre completo").value).toBe("Ana Torres");
    expect(screen.getByLabelText("Edad").value).toBe("28");
    expect(screen.getByText("Aprobado")).toBeTruthy();
    expect(screen.getByAltText("Foto actual 1 de Ana Torres")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Guardar perfil" })).toBeNull();
  });

  it("actualiza el perfil y sólo reemplaza fotos cuando se seleccionan nuevas", async () => {
    const catalogService = serviceWithProfile();
    render(
      <CastingView
        catalogService={catalogService}
        runProtected={(operation) => operation()}
        user={USER}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Mi perfil" }));
    const submit = await screen.findByRole("button", { name: "Actualizar perfil" });
    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Ana Actualizada" },
    });
    const replacement = new File(["new"], "nueva.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Seleccionar imágenes"), {
      target: { files: [replacement] },
    });
    fireEvent.submit(submit.closest("form"));

    await waitFor(() => expect(catalogService.updateCasting).toHaveBeenCalledWith(
      "casting-own",
      expect.objectContaining({
        fullName: "Ana Actualizada",
        sexId: "sex-f",
        skinToneId: "skin-1",
        cultureIds: ["culture-1"],
        rates: { hourly: null, daily: { value: 125, negotiable: false } },
      }),
      [replacement],
    ));
    expect(catalogService.createCasting).not.toHaveBeenCalled();
    expect(await screen.findByText(/Perfil actualizado/)).toBeTruthy();
  });

  it("conserva las fotos actuales al actualizar sin archivos nuevos", async () => {
    const catalogService = serviceWithProfile();
    render(
      <CastingView
        catalogService={catalogService}
        runProtected={(operation) => operation()}
        user={USER}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Mi perfil" }));
    const submit = await screen.findByRole("button", { name: "Actualizar perfil" });
    fireEvent.submit(submit.closest("form"));

    await waitFor(() => expect(catalogService.updateCasting).toHaveBeenCalledWith(
      "casting-own",
      expect.any(Object),
      [],
    ));
  });

  it("permite crear el primer perfil cuando la cuenta todavía no tiene uno", async () => {
    const catalogService = serviceWithProfile(null);
    render(
      <CastingView
        catalogService={catalogService}
        runProtected={(operation) => operation()}
        user={USER}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Mi perfil" }));
    const submit = await screen.findByRole("button", { name: "Guardar perfil" });
    const image = new File(["photo"], "actor.jpg", { type: "image/jpeg" });
    fireEvent.click(screen.getByLabelText("Mestiza"));
    fireEvent.change(screen.getByLabelText("Seleccionar imágenes"), {
      target: { files: [image] },
    });
    fireEvent.submit(submit.closest("form"));

    await waitFor(() => expect(catalogService.createCasting).toHaveBeenCalledOnce());
    expect(catalogService.updateCasting).not.toHaveBeenCalled();
  });

  it("no muestra el formulario si no pudo comprobar si ya existe un perfil", async () => {
    const catalogService = serviceWithProfile();
    catalogService.getMyCasting.mockRejectedValue(new Error("No se pudo consultar el perfil."));
    render(
      <CastingView
        catalogService={catalogService}
        runProtected={(operation) => operation()}
        user={USER}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Mi perfil" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Guardar perfil" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Actualizar perfil" })).toBeNull();
  });
});
