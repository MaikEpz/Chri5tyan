import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailVerificationPage } from "../../src/presentation/features/auth/EmailVerificationPage.jsx";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("EmailVerificationPage", () => {
  it("verifica sin crear una sesión automática", async () => {
    const verifyEmail = vi.fn().mockResolvedValue({
      status: "VERIFIED",
      maskedEmail: "m***@gmail.com",
    });
    const authSessionService = {
      verifyEmail,
      resendVerification: vi.fn(),
      login: vi.fn(),
    };

    render(<EmailVerificationPage authSessionService={authSessionService} token="signed-token" />);

    await screen.findByText("Correo verificado");
    expect(verifyEmail).toHaveBeenCalledWith("signed-token");
    expect(authSessionService.login).not.toHaveBeenCalled();
    expect(screen.getByText(/m\*\*\*@gmail.com/)).toBeTruthy();
  });

  it("permite solicitar otro enlace cuando el token venció", async () => {
    const resendVerification = vi.fn().mockResolvedValue({
      accepted: true,
      retryAfterSeconds: 60,
    });
    const authSessionService = {
      verifyEmail: vi.fn().mockRejectedValue({ code: "VERIFICATION_TOKEN_EXPIRED" }),
      resendVerification,
      login: vi.fn(),
    };

    render(<EmailVerificationPage authSessionService={authSessionService} token="expired-token" />);
    await screen.findByText("El enlace venció");
    fireEvent.change(screen.getByLabelText("Correo de tu cuenta"), {
      target: { value: "maicol.epz@gmail.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar un enlace nuevo" }));

    await waitFor(() => expect(resendVerification).toHaveBeenCalledWith("maicol.epz@gmail.com"));
    expect(await screen.findByText(/enviaremos un enlace nuevo/i)).toBeTruthy();
  });

  it("continúa dentro de React después de iniciar sesión", async () => {
    const onContinue = vi.fn();
    const authSessionService = {
      verifyEmail: vi.fn().mockResolvedValue({ status: "VERIFIED" }),
      resendVerification: vi.fn(),
      login: vi.fn().mockResolvedValue({
        accessToken: "token",
        user: { id: "user-1", fullName: "Usuario Prueba" },
      }),
    };

    render(
      <EmailVerificationPage
        authSessionService={authSessionService}
        token="signed-token"
        onContinue={onContinue}
      />,
    );

    await screen.findByText("Correo verificado");
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "usuario@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form"));

    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(authSessionService.login).toHaveBeenCalledWith({
      email: "usuario@example.com",
      password: "password123",
    });
  });
});
