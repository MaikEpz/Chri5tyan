import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAccountMenu } from "../../src/presentation/features/workspace/WorkspaceAccountMenu.jsx";

const USER = {
  fullName: "Usuario Prueba",
  email: "usuario@example.com",
};

afterEach(cleanup);

describe("WorkspaceAccountMenu", () => {
  it("abre la cuenta sin cerrar sesión y muestra la identidad", () => {
    const onLogout = vi.fn();
    render(
      <WorkspaceAccountMenu
        user={USER}
        navigationKey="quotes"
        onLogin={vi.fn()}
        onLogout={onLogout}
      />,
    );

    const avatar = screen.getByRole("button", { name: "Abrir cuenta de Usuario Prueba" });
    fireEvent.click(avatar);

    expect(avatar.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Usuario Prueba")).toBeTruthy();
    expect(screen.getByText("usuario@example.com")).toBeTruthy();
    expect(onLogout).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("dialog", { name: "Cuenta de usuario" }));
  });

  it("solicita confirmación y permite cancelarla", () => {
    const onLogout = vi.fn();
    render(
      <WorkspaceAccountMenu
        user={USER}
        navigationKey="quotes"
        onLogin={vi.fn()}
        onLogout={onLogout}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir cuenta de Usuario Prueba" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(screen.getByText("¿Cerrar sesión?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("confirma la salida y vuelve al icono de acceso", () => {
    const onLogout = vi.fn();

    function AccountHarness() {
      const [user, setUser] = useState(USER);
      return (
        <WorkspaceAccountMenu
          user={user}
          navigationKey="quotes"
          onLogin={vi.fn()}
          onLogout={() => {
            onLogout();
            setUser(null);
          }}
        />
      );
    }

    render(<AccountHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir cuenta de Usuario Prueba" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, salir" }));

    expect(onLogout).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Cuenta de usuario" })).toBeNull();
  });

  it("cierra el menú con Escape, clic exterior y cambio de sección", () => {
    const { rerender } = render(
      <WorkspaceAccountMenu
        user={USER}
        navigationKey="quotes"
        onLogin={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    const avatar = screen.getByRole("button", { name: "Abrir cuenta de Usuario Prueba" });

    fireEvent.click(avatar);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(avatar);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(avatar);
    rerender(
      <WorkspaceAccountMenu
        user={USER}
        navigationKey="casting"
        onLogin={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("abre el acceso directamente cuando no hay sesión", () => {
    const onLogin = vi.fn();
    render(
      <WorkspaceAccountMenu
        user={null}
        navigationKey="quotes"
        onLogin={onLogin}
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(onLogin).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
