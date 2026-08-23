import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Dialog } from "../../components/ui/Dialog.jsx";
import { SegmentedControl } from "../../components/ui/SegmentedControl.jsx";
import { TextField } from "../../components/ui/TextField.jsx";

const EMAIL_KEY = "chris.verification.email";

function maskEmail(email) {
  const [local = "", domain = ""] = String(email).split("@");
  if (!domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
}

export function AuthDialog({
  authSessionService,
  open,
  initialMode = "login",
  onAuthenticated,
  onClose,
}) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [rememberedEmail, setRememberedEmail] = useState(
    () => sessionStorage.getItem(EMAIL_KEY) || "",
  );

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
      setPending(null);
      setResendMessage("");
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown > 0]);

  if (!open) return null;

  const showPending = (email, retryAfterSeconds = 60) => {
    const normalized = String(email).trim();
    sessionStorage.setItem(EMAIL_KEY, normalized);
    setRememberedEmail(normalized);
    setPending({ email: normalized, maskedEmail: maskEmail(normalized) });
    setCountdown(retryAfterSeconds);
    setResendMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") || "").trim();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        const session = await authSessionService.login({
          email,
          password: values.get("password"),
        });
        await onAuthenticated(session);
      } else {
        const registration = await authSessionService.register({
          fullName: values.get("fullName"),
          email,
          password: values.get("password"),
          phone: values.get("phone") || "",
        });
        if (registration?.verificationRequired) {
          showPending(
            registration.user?.email || email,
            registration.resendAfterSeconds || 60,
          );
        }
      }
    } catch (submitError) {
      if (submitError?.code === "EMAIL_NOT_VERIFIED") {
        showPending(email);
      } else if (submitError?.code === "ACCOUNT_ALREADY_EXISTS") {
        sessionStorage.setItem(EMAIL_KEY, email);
        setRememberedEmail(email);
        setMode("login");
        setError("La cuenta ya está verificada. Inicia sesión con tu contraseña.");
      } else {
        setError(submitError?.message || "No se pudo completar la operación.");
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!pending || countdown > 0) return;
    setBusy(true);
    setResendMessage("");
    try {
      const response = await authSessionService.resendVerification(pending.email);
      const seconds = response?.retryAfterSeconds || 60;
      setCountdown(seconds);
      setResendMessage("Solicitud recibida. Revisa también Spam y Promociones.");
    } catch (resendError) {
      setResendMessage(resendError?.message || "No pudimos solicitar otro enlace.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog className="max-w-120 p-[clamp(1.5rem,4vw,2.5rem)]" labelledBy="auth-title">
        <Button
          className="absolute top-4 right-4 text-xl font-normal"
          size="icon"
          variant="secondary"
          aria-label="Cerrar"
          onClick={onClose}
        >×</Button>
        <span className="text-xs font-bold tracking-[0.18em] text-chris-accent uppercase">
          Cuenta Chris
        </span>
        <h2 className="my-3 pr-12 text-3xl font-bold" id="auth-title">
          {pending ? "Revisa tu correo" : mode === "login" ? "Continúa con tu cuenta" : "Crea tu cuenta"}
        </h2>

        {pending ? (
          <div className="mt-6 grid gap-4" role="status">
            <p className="m-0 leading-relaxed text-chris-muted">Estamos enviando un enlace de verificación a:</p>
            <strong className="[overflow-wrap:anywhere] text-base text-white">{pending.maskedEmail}</strong>
            <p className="m-0 leading-relaxed text-chris-muted">El envío puede tardar unos minutos. Revisa también las carpetas Spam y Promociones.</p>
            <Button disabled={busy || countdown > 0} onClick={resend}>
              {countdown > 0 ? `Reenviar en ${countdown}s` : busy ? "Solicitando…" : "Reenviar correo"}
            </Button>
            {resendMessage && <p className="m-0 text-sm text-chris-muted" role="status">{resendMessage}</p>}
            <div className="flex flex-wrap gap-2">
              <Button className="px-0 underline" size="compact" variant="ghost" onClick={() => { setPending(null); setMode("register"); setRememberedEmail(""); }}>
                Cambiar correo
              </Button>
              <Button className="px-0 underline" size="compact" variant="ghost" onClick={() => { setPending(null); setMode("login"); }}>
                Volver al login
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="leading-relaxed text-white/50">Tu selección y los datos del formulario se conservarán mientras accedes.</p>
            {mode === "login" && (
              <p className="rounded-xl border border-chris-accent/25 bg-chris-accent/8 px-4 py-3 text-sm leading-relaxed text-white/75">
                Acceso temporal de demostración: usuario <strong>admin</strong> y contraseña <strong>admin</strong>.
              </p>
            )}
            <div className="my-6">
              <SegmentedControl
                label="Acceso"
                value={mode}
                onChange={setMode}
                items={[["login", "Iniciar sesión"], ["register", "Crear cuenta"]]}
              />
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {mode === "register" && <TextField label="Nombre completo" name="fullName" required maxLength="120" autoComplete="name" />}
              <TextField key={`${mode}-${rememberedEmail}`} label="Correo" name="email" type={mode === "login" ? "text" : "email"} required autoComplete={mode === "login" ? "username" : "email"} defaultValue={rememberedEmail} />
              <TextField label="Contraseña" name="password" type="password" required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              {mode === "register" && <TextField label="Teléfono" hint="Opcional" name="phone" type="tel" autoComplete="tel" />}
              {error && <p className="m-0 text-sm text-chris-danger" role="alert">{error}</p>}
              <Button type="submit" disabled={busy}>
                {busy ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Button>
            </form>
          </>
        )}
    </Dialog>
  );
}
