import { useEffect } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ViewerPage } from "../../src/presentation/components/ViewerPage.jsx";

function ReadyViewport({ onMonitorClose, onMonitorOpen, onWorldReady }) {
  useEffect(() => onWorldReady(), [onWorldReady]);
  return (
    <section aria-label="Visor de prueba">
      <button type="button" onClick={() => onMonitorOpen("desktop")}>Abrir monitor</button>
      <button type="button" onClick={onMonitorClose}>Cerrar monitor</button>
    </section>
  );
}

function renderViewer() {
  return render(
    <ViewerPage
      authSessionService={{}}
      catalogService={{}}
      createCinemaRequestUseCase={{}}
      exportProductionQuoteUseCase={{}}
      modelAsset={{ name: "Chris" }}
      ViewportComponent={ReadyViewport}
    />,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  vi.stubGlobal("requestAnimationFrame", (callback) => callback());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("aviso móvil de pantalla completa", () => {
  it("aparece en la primera carga y no vuelve tras descartarlo durante la sesión", async () => {
    renderViewer();

    expect(await screen.findByRole("dialog", { name: "¿Pantalla completa?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "¿Pantalla completa?" })).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Abrir monitor" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar monitor" }));

    expect(screen.queryByRole("dialog", { name: "¿Pantalla completa?" })).toBeNull();
  });
});
