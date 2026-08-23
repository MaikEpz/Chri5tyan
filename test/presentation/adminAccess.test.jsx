import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductionWorkspace } from "../../src/presentation/features/workspace/ProductionWorkspace.jsx";

function moderationPage() {
  return {
    records: [],
    hasMore: false,
    page: 0,
    totalElements: 0,
    totalPages: 0,
  };
}

function catalogService() {
  return {
    listCastingModeration: vi.fn(async () => moderationPage()),
    listLocationsModeration: vi.fn(async () => moderationPage()),
  };
}

function authService({ initialSession = null, restoredSession = null } = {}) {
  let listener = null;
  return {
    getSession: vi.fn(() => initialSession),
    subscribe: vi.fn((nextListener) => {
      listener = nextListener;
      return () => {
        listener = null;
      };
    }),
    restore: vi.fn(async () => {
      if (restoredSession) listener?.(restoredSession);
      return restoredSession;
    }),
    logout: vi.fn(() => listener?.(null)),
  };
}

function renderWorkspace(authSessionService) {
  return render(
    <ProductionWorkspace
      authSessionService={authSessionService}
      catalogService={catalogService()}
      createCinemaRequestUseCase={{ execute: vi.fn() }}
      exportProductionQuoteUseCase={{ execute: vi.fn() }}
      onBack={vi.fn()}
    />,
  );
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class ResizeObserver {
    observe() {}

    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("acceso administrativo", () => {
  it("abre la moderación al restaurar una sesión ADMIN", async () => {
    const adminSession = {
      accessToken: "admin-token",
      user: {
        id: "admin-1",
        fullName: "Administradora",
        email: "admin@example.com",
        role: "ADMIN",
      },
    };
    const service = authService({ restoredSession: adminSession });

    renderWorkspace(service);

    expect(await screen.findByRole("heading", { name: "Moderación de registros" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Administrar" }).getAttribute("data-active")).toBe("true");
    expect(screen.getByRole("tablist", { name: "Área administrativa" }).parentElement.classList.contains("admin-section-navigation")).toBe(true);
  });

  it("no muestra la sección administrativa a cuentas CLIENT", () => {
    const service = authService({
      initialSession: {
        accessToken: "client-token",
        user: {
          id: "client-1",
          fullName: "Cliente",
          email: "client@example.com",
          role: "CLIENT",
        },
      },
    });

    renderWorkspace(service);

    expect(screen.queryByRole("button", { name: "Administrar" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Moderación de registros" })).toBeNull();
  });

  it("oculta la administración y vuelve a cotizaciones al cerrar sesión", async () => {
    const service = authService({
      initialSession: {
        accessToken: "admin-token",
        user: {
          id: "admin-1",
          fullName: "Administradora",
          email: "admin@example.com",
          role: "ADMIN",
        },
      },
    });
    renderWorkspace(service);
    await screen.findByRole("heading", { name: "Moderación de registros" });

    fireEvent.click(screen.getByRole("button", { name: "Abrir cuenta de Administradora" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, salir" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Administrar" })).toBeNull());
    expect(screen.getByRole("button", { name: "Cotizaciones" }).getAttribute("data-active")).toBe("true");
    expect(service.logout).toHaveBeenCalledOnce();
  });
});
