import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminCastingCatalogsView } from "../../src/presentation/features/admin/AdminCastingCatalogsView.jsx";

afterEach(cleanup);

describe("catálogos administrativos de casting", () => {
  it("protege sexo y permite crear culturas", async () => {
    const service = {
      getCastingCatalogsAdmin: vi.fn().mockResolvedValue({
        sexes: [{ id: "sex-f", name: "Femenino", active: true, displayOrder: 10 }, { id: "sex-m", name: "Masculino", active: true, displayOrder: 20 }],
        skinTones: [],
        cultures: [],
      }),
      createCastingCatalogOption: vi.fn().mockResolvedValue({}),
      updateCastingCatalogOption: vi.fn().mockResolvedValue({}),
      deleteCastingCatalogOption: vi.fn().mockResolvedValue({}),
    };
    render(<AdminCastingCatalogsView catalogService={service} />);

    expect(await screen.findByText(/limitado a Masculino y Femenino/)).toBeTruthy();
    const firstOption = screen.getByLabelText("Nombre de Femenino").closest("article");
    expect(firstOption.classList.contains("admin-catalog-option-card")).toBe(true);
    expect(firstOption.parentElement.classList.contains("admin-catalog-options-grid")).toBe(true);
    expect(screen.queryByRole("button", { name: "Crear" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Culturas" }));
    fireEvent.change(screen.getByLabelText("Nombre de la opción"), { target: { value: "Costeña" } });
    fireEvent.change(screen.getByLabelText("Orden"), { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => expect(service.createCastingCatalogOption).toHaveBeenCalledWith(
      "CULTURE", { name: "Costeña", displayOrder: 80, active: true },
    ));
  });
});
