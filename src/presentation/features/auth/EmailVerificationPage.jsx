import { useEffect, useRef, useState } from "react";
import chrisLogoUrl from "../../../assets/branding/chris-logo.svg";
import { Button } from "../../components/ui/Button.jsx";
import { TextField } from "../../components/ui/TextField.jsx";
import { AuthDialog } from "./AuthDialog.jsx";

const EMAIL_KEY = "chris.verification.email";

export function EmailVerificationPage({ authSessionService, token, onContinue = () => {} }) {
  const requested = useRef(false);
  const [state, setState] = useState(token ? "verifying" : "invalid");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState(
    () => sessionStorage.getItem(EMAIL_KEY) || "",
  );
  const [resendMessage, setResendMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (!token) {
      setState("invalid");
      return;
    }
    setState("verifying");
    try {
      const result = await authSessionService.verifyEmail(token);
      setMaskedEmail(result.maskedEmail || "");
      setState(result.status === "ALREADY_VERIFIED" ? "already" : "verified");
    } catch (error) {
      if (error?.code === "VERIFICATION_TOKEN_EXPIRED") setState("expired");
      else if (error?.code === "VERIFICATION_TOKEN_REPLACED") setState("replaced");
      else if (error?.code === "NETWORK_ERROR") setState("network");
      else setState("invalid");
    }
  };

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void verify();
  }, []);

  const resend = async (event) => {
    event.preventDefault();
    setBusy(true);
    setResendMessage("");
    try {
      await authSessionService.resendVerification(resendEmail.trim());
      sessionStorage.setItem(EMAIL_KEY, resendEmail.trim());
      setResendMessage("Si la cuenta está pendiente, enviaremos un enlace nuevo.");
    } catch (error) {
      setResendMessage(error?.message || "No pudimos solicitar otro enlace.");
    } finally {
      setBusy(false);
    }
  };

  const successful = state === "verified" || state === "already";
  const canResend = state === "expired" || state === "replaced" || state === "invalid";

  return (
    <main className="grid min-h-dvh place-items-center bg-chris-background p-6 text-white">
      <section className="grid w-full max-w-136 gap-5 rounded-chris-dialog bg-black/60 p-[clamp(1.75rem,5vw,3rem)] shadow-chris-dialog backdrop-blur" aria-live="polite">
        <img className="max-h-14 w-32 object-contain object-left" src={chrisLogoUrl} alt="Chris" />
        {state === "verifying" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">Verificando tu correo…</h1><p className="m-0 leading-relaxed text-chris-muted">Esto tomará solo un momento.</p></>}
        {state === "verified" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">Correo verificado</h1><p className="m-0 leading-relaxed text-chris-muted">Tu cuenta ya está activa{maskedEmail ? ` para ${maskedEmail}` : ""}.</p></>}
        {state === "already" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">Tu cuenta ya estaba verificada</h1><p className="m-0 leading-relaxed text-chris-muted">Puedes iniciar sesión normalmente.</p></>}
        {state === "expired" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">El enlace venció</h1><p className="m-0 leading-relaxed text-chris-muted">Solicita uno nuevo para terminar la activación.</p></>}
        {state === "replaced" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">Hay un enlace más reciente</h1><p className="m-0 leading-relaxed text-chris-muted">Usa el último correo recibido o solicita otro enlace.</p></>}
        {state === "invalid" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">Enlace no válido</h1><p className="m-0 leading-relaxed text-chris-muted">El enlace está incompleto o no pertenece a una verificación activa.</p></>}
        {state === "network" && <><h1 className="m-0 text-[clamp(1.8rem,6vw,2.6rem)] leading-tight font-bold">No pudimos conectar</h1><p className="m-0 leading-relaxed text-chris-muted">Comprueba tu conexión y vuelve a intentarlo.</p></>}

        {successful && (
          <Button onClick={() => setLoginOpen(true)}>
            Iniciar sesión
          </Button>
        )}
        {state === "network" && (
          <Button onClick={verify}>Reintentar</Button>
        )}
        {canResend && (
          <form className="grid gap-4" onSubmit={resend}>
            <TextField
              label="Correo de tu cuenta"
              type="email"
              required
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              autoComplete="email"
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Solicitando…" : "Enviar un enlace nuevo"}
            </Button>
            {resendMessage && <p className="m-0 text-sm text-chris-muted" role="status">{resendMessage}</p>}
          </form>
        )}
        <Button className="justify-self-start px-0 underline" size="compact" variant="ghost" onClick={onContinue}>
          Volver al inicio
        </Button>
      </section>
      <AuthDialog
        authSessionService={authSessionService}
        open={loginOpen}
        initialMode="login"
        onAuthenticated={() => {
          setLoginOpen(false);
          onContinue();
        }}
        onClose={() => setLoginOpen(false)}
      />
    </main>
  );
}
