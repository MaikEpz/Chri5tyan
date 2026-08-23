import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import chrisLogoUrl from "../../../assets/branding/chris-logo.svg";
import { lazyNamed } from "../../lazyNamed.js";
import { LoadingSkeletons } from "../../components/ui/LoadingSkeletons.jsx";
import { QuotesView } from "../quotes/QuotesView.jsx";
import { WorkspaceAccountMenu } from "./WorkspaceAccountMenu.jsx";

const AdminView = lazyNamed(() => import("../admin/AdminView.jsx"), "AdminView");
const AuthDialog = lazyNamed(() => import("../auth/AuthDialog.jsx"), "AuthDialog");
const CastingView = lazyNamed(() => import("../casting/CastingView.jsx"), "CastingView");
const EquipmentView = lazyNamed(() => import("../equipment/EquipmentView.jsx"), "EquipmentView");
const LocationsView = lazyNamed(() => import("../locations/LocationsView.jsx"), "LocationsView");

const WORKSPACE_SECTIONS = Object.freeze([
  { id: "quotes", label: "Cotizaciones" },
  { id: "casting", label: "Casting" },
  { id: "locations", label: "Locaciones" },
  { id: "equipment", label: "Equipos" },
]);

const ADMIN_SECTION = Object.freeze({ id: "admin", label: "Administrar" });

function authenticationCancelled() {
  return Object.assign(new Error("Acceso cancelado."), { code: "AUTH_CANCELLED" });
}

export function ProductionWorkspace({
  authSessionService,
  catalogService,
  createCinemaRequestUseCase,
  exportProductionQuoteUseCase,
  onBack,
}) {
  const [activeSection, setActiveSection] = useState(WORKSPACE_SECTIONS[0].id);
  const [session, setSession] = useState(() => authSessionService.getSession());
  const [authOpen, setAuthOpen] = useState(false);
  const pendingAction = useRef(null);
  const isAdmin = session?.user?.role === "ADMIN";
  const availableSections = isAdmin
    ? [...WORKSPACE_SECTIONS, ADMIN_SECTION]
    : WORKSPACE_SECTIONS;

  useEffect(() => authSessionService.subscribe(setSession), [authSessionService]);
  useEffect(() => {
    void authSessionService.restore();
  }, [authSessionService]);
  useEffect(() => {
    if (isAdmin) setActiveSection("admin");
    else setActiveSection((current) => (current === "admin" ? "quotes" : current));
  }, [isAdmin]);

  const runProtected = useCallback((action) => {
    if (session?.user) return Promise.resolve().then(action);
    setAuthOpen(true);
    return new Promise((resolve, reject) => {
      pendingAction.current = { action, resolve, reject };
    });
  }, [session]);

  const closeAuth = () => {
    pendingAction.current?.reject(authenticationCancelled());
    pendingAction.current = null;
    setAuthOpen(false);
  };

  const handleAuthenticated = async (authenticatedSession) => {
    setSession(authenticatedSession);
    setAuthOpen(false);
    const pending = pendingAction.current;
    pendingAction.current = null;
    if (!pending) return;
    try {
      pending.resolve(await pending.action());
    } catch (error) {
      pending.reject(error);
    }
  };

  return (
    <div className="production-workspace">
      <header className="workspace-header">
        <button className="workspace-back" type="button" onClick={onBack}>
          <span className="workspace-back-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />
            </svg>
          </span>
          <span className="workspace-back-label">Volver</span>
        </button>
        <span className="workspace-brand" aria-label="Chris">
          <img src={chrisLogoUrl} alt="" aria-hidden="true" />
        </span>
        <nav className="workspace-navigation" aria-label="Navegación principal">
          <div className="workspace-section-links">
            {availableSections.map((section) => (
              <button
                key={section.id}
                type="button"
                data-active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
          <WorkspaceAccountMenu
            user={session?.user ?? null}
            navigationKey={activeSection}
            onLogin={() => setAuthOpen(true)}
            onLogout={() => {
              setActiveSection("quotes");
              authSessionService.logout();
            }}
          />
        </nav>
      </header>
      <main className="workspace-main">
        <Suspense fallback={<WorkspaceSectionFallback />}>
          {activeSection === "quotes" && (
            <QuotesView
              catalogService={catalogService}
              createCinemaRequestUseCase={createCinemaRequestUseCase}
              exportProductionQuoteUseCase={exportProductionQuoteUseCase}
              runProtected={runProtected}
              user={session?.user ?? null}
            />
          )}
          {activeSection === "casting" && (
            <CastingView
              catalogService={catalogService}
              runProtected={runProtected}
              user={session?.user ?? null}
            />
          )}
          {activeSection === "locations" && (
            <LocationsView catalogService={catalogService} runProtected={runProtected} />
          )}
          {activeSection === "equipment" && (
            <EquipmentView catalogService={catalogService} />
          )}
          {activeSection === "admin" && isAdmin && (
            <AdminView catalogService={catalogService} />
          )}
        </Suspense>
      </main>
      {authOpen && (
        <Suspense fallback={null}>
          <AuthDialog
            authSessionService={authSessionService}
            open
            onAuthenticated={handleAuthenticated}
            onClose={closeAuth}
          />
        </Suspense>
      )}
    </div>
  );
}

function WorkspaceSectionFallback() {
  return (
    <div className="workspace-view">
      <LoadingSkeletons count={3} label="Cargando sección" variant="catalog" />
    </div>
  );
}
