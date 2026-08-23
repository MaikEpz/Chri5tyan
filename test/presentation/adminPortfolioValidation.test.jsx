import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPortfolioView } from "../../src/presentation/features/admin/AdminPortfolioView.jsx";

afterEach(cleanup);

describe("validación del portafolio administrativo", () => {
  it("exige reemplazar el medio principal cuando cambia su tipo", async () => {
    const catalogService = {
      listPortfolioAdmin: vi.fn(async () => ({
        records: [{
          id: "portfolio-1",
          type: "PHOTO",
          title: "Pieza editorial",
          category: "Editorial",
          client: "Cliente",
          active: true,
          displayOrder: 0,
          media: { id: "media-1", url: "https://example.com/photo.jpg" },
          cover: null,
        }],
        hasMore: false,
        fallback: false,
      })),
      updatePortfolioItem: vi.fn(),
    };

    render(<AdminPortfolioView catalogService={catalogService} />);
    await screen.findByRole("heading", { name: "Pieza editorial" });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "VIDEO" } });
    fireEvent.submit(screen.getByRole("button", { name: "Guardar pieza" }).closest("form"));

    expect((await screen.findByRole("alert")).textContent).toContain("Selecciona el archivo principal.");
    await waitFor(() => expect(catalogService.updatePortfolioItem).not.toHaveBeenCalled());
  });
});
