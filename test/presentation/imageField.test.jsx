import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CastingView } from "../../src/presentation/features/casting/CastingView.jsx";
import { ImageField } from "../../src/presentation/components/forms/ImageField.jsx";

function file(name, options = {}) {
  return new File([options.content || name], name, {
    type: options.type || "image/jpeg",
    lastModified: options.lastModified || 1,
  });
}

function ImageFieldHarness() {
  const [files, setFiles] = useState([]);
  return (
    <ImageField
      label="Fotos"
      hint="Máximo 5 imágenes"
      files={files}
      onFilesChange={setFiles}
    />
  );
}

beforeEach(() => {
  let previewNumber = 0;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => `blob:preview-${previewNumber += 1}`),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ImageField", () => {
  it("acumula selecciones, evita duplicados y respeta el máximo", () => {
    render(<ImageFieldHarness />);
    const input = screen.getByLabelText("Seleccionar imágenes");
    const first = file("actor-1.jpg");
    const duplicate = file("actor-1.jpg");

    fireEvent.change(input, { target: { files: [first] } });
    fireEvent.change(input, {
      target: {
        files: [
          duplicate,
          file("actor-2.jpg"),
          file("actor-3.jpg"),
          file("actor-4.jpg"),
          file("actor-5.jpg"),
          file("actor-6.jpg"),
        ],
      },
    });

    expect(screen.getByText("5 archivos")).toBeTruthy();
    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(screen.queryByAltText("Previsualización de actor-6.jpg")).toBeNull();
  });

  it("permite eliminar una imagen con un botón accesible", () => {
    render(<ImageFieldHarness />);
    const input = screen.getByLabelText("Seleccionar imágenes");

    fireEvent.change(input, {
      target: { files: [file("frontal.jpg"), file("perfil.jpg")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Eliminar frontal.jpg" }));

    expect(screen.queryByAltText("Previsualización de frontal.jpg")).toBeNull();
    expect(screen.getByAltText("Previsualización de perfil.jpg")).toBeTruthy();
    expect(screen.getByText("1 archivo")).toBeTruthy();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe("registro de casting", () => {
  it("conserva las imágenes si falla el envío y las limpia al completarse", async () => {
    const uploadError = new Error("No se pudo guardar");
    const catalogService = {
      getCastingCatalogs: vi.fn().mockResolvedValue({
        sexes: [{ id: "sex-f", name: "Femenino", active: true, displayOrder: 10 }],
        skinTones: [{ id: "skin-1", name: "Medio", active: true, displayOrder: 10 }],
        cultures: [{ id: "culture-1", name: "Mestiza", active: true, displayOrder: 10 }],
      }),
      listCasting: vi.fn().mockResolvedValue({
        records: [],
        hasMore: false,
        fallback: false,
      }),
      createCasting: vi.fn()
        .mockRejectedValueOnce(uploadError)
        .mockResolvedValueOnce({ id: "actor-1" }),
    };
    const runProtected = vi.fn((operation) => operation());

    render(<CastingView catalogService={catalogService} runProtected={runProtected} />);
    fireEvent.click(screen.getByRole("tab", { name: "Registrar actor" }));
    fireEvent.click(await screen.findByLabelText("Mestiza"));

    const selectedImage = file("retrato.jpg");
    fireEvent.change(screen.getByLabelText("Seleccionar imágenes"), {
      target: { files: [selectedImage] },
    });

    const submitButton = screen.getByRole("button", { name: "Guardar perfil" });
    fireEvent.submit(submitButton.closest("form"));

    expect((await screen.findByRole("alert")).textContent).toContain("No se pudo guardar");
    expect(screen.getByAltText("Previsualización de retrato.jpg")).toBeTruthy();
    expect(catalogService.createCasting).toHaveBeenLastCalledWith(
      expect.any(Object),
      [selectedImage],
    );

    fireEvent.submit(submitButton.closest("form"));

    await waitFor(() => {
      expect(screen.queryByAltText("Previsualización de retrato.jpg")).toBeNull();
    });
    expect(await screen.findByText(/Perfil enviado/)).toBeTruthy();
    expect(catalogService.createCasting).toHaveBeenCalledTimes(2);
  });
});
