import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductionWorkspace } from "../../src/presentation/features/workspace/ProductionWorkspace.jsx";

function renderWorkspace() {
  return render(
    <div className="monitor-app" data-testid="scroll-container">
      <ProductionWorkspace
        authSessionService={{
          getSession: () => null,
          subscribe: () => () => {},
          restore: async () => null,
        }}
        catalogService={{}}
        createCinemaRequestUseCase={{ execute: vi.fn() }}
        exportProductionQuoteUseCase={{ execute: vi.fn() }}
        onBack={vi.fn()}
      />
    </div>,
  );
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class ResizeObserver {
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("barra de navegación móvil", () => {
  it("se oculta al bajar y reaparece al subir", async () => {
    renderWorkspace();
    const scroller = screen.getByTestId("scroll-container");
    const workspace = scroller.querySelector(".production-workspace");

    scroller.scrollTop = 120;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(workspace.classList.contains("is-header-hidden")).toBe(true));

    scroller.scrollTop = 100;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(workspace.classList.contains("is-header-hidden")).toBe(false));
  });

  it("permanece visible cerca del inicio", () => {
    renderWorkspace();
    const scroller = screen.getByTestId("scroll-container");
    const workspace = scroller.querySelector(".production-workspace");

    scroller.scrollTop = 8;
    fireEvent.scroll(scroller);

    expect(workspace.classList.contains("is-header-hidden")).toBe(false);
  });
});
