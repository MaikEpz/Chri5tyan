import { useEffect, useRef, useState } from "react";

const MENU_ID = "workspace-account-menu";

export function WorkspaceAccountMenu({
  user,
  onLogin,
  onLogout,
  navigationKey,
}) {
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const controlRef = useRef(null);
  const avatarRef = useRef(null);
  const menuRef = useRef(null);
  const cancelRef = useRef(null);

  const accountName = user?.fullName?.trim() || "Usuario";
  const accountInitial = accountName.charAt(0).toLocaleUpperCase("es");

  const closeMenu = ({ restoreFocus = false } = {}) => {
    setOpen(false);
    setConfirmingLogout(false);
    if (restoreFocus) {
      requestAnimationFrame(() => avatarRef.current?.focus());
    }
  };

  useEffect(() => {
    setOpen(false);
    setConfirmingLogout(false);
  }, [navigationKey, user]);

  useEffect(() => {
    if (!open) return undefined;

    menuRef.current?.focus();
    const handlePointerDown = (event) => {
      if (!controlRef.current?.contains(event.target)) closeMenu();
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (confirmingLogout) cancelRef.current?.focus();
  }, [confirmingLogout]);

  const handleAvatarClick = () => {
    if (!user) {
      onLogin();
      return;
    }
    if (open) closeMenu();
    else setOpen(true);
  };

  const handleLogout = () => {
    onLogout();
    closeMenu();
  };

  const accountActionLabel = user
    ? `Abrir cuenta de ${accountName}`
    : "Iniciar sesión";

  return (
    <div className="workspace-account-control" ref={controlRef}>
      <button
        ref={avatarRef}
        className="workspace-account"
        type="button"
        aria-label={accountActionLabel}
        title={accountActionLabel}
        aria-haspopup={user ? "dialog" : undefined}
        aria-expanded={user ? open : undefined}
        aria-controls={user && open ? MENU_ID : undefined}
        onClick={handleAvatarClick}
      >
        {user ? (
          <span className="workspace-account-initial" aria-hidden="true">
            {accountInitial}
          </span>
        ) : (
          <svg
            className="workspace-account-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
          </svg>
        )}
      </button>

      {user && open && (
        <section
          ref={menuRef}
          id={MENU_ID}
          className="workspace-account-menu"
          role="dialog"
          aria-label="Cuenta de usuario"
          tabIndex="-1"
        >
          <div className="workspace-account-identity">
            <span className="workspace-account-menu-avatar" aria-hidden="true">
              {accountInitial}
            </span>
            <div>
              <strong>{accountName}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          {confirmingLogout ? (
            <div className="workspace-logout-confirmation" role="group" aria-label="Confirmar cierre de sesión">
              <p>¿Cerrar sesión?</p>
              <div>
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={() => setConfirmingLogout(false)}
                >
                  Cancelar
                </button>
                <button className="is-danger" type="button" onClick={handleLogout}>
                  Sí, salir
                </button>
              </div>
            </div>
          ) : (
            <button
              className="workspace-logout-action"
              type="button"
              onClick={() => setConfirmingLogout(true)}
            >
              Cerrar sesión
            </button>
          )}
        </section>
      )}
    </div>
  );
}
