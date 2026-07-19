import { useEffect, useState } from "react";
import chrisLogoWhiteUrl from "../../../assets/branding/chris-logo.svg";
import { SCREEN_VIEWS } from "../sceneConfig.js";

export function FullscreenMonitor({
  activeView = 0,
  isClosing = false,
  isVisible = false,
  origin = null,
  onActiveViewChange = () => {},
  onClose = () => {},
  onEnterComplete = () => {},
  onExitComplete = () => {},
}) {
  const [logoHiding, setLogoHiding] = useState(false);
  const [logoReturning, setLogoReturning] = useState(false);
  useEffect(() => {
    if (!isVisible) {
      setLogoHiding(false);
      setLogoReturning(false);
    }
  }, [isVisible]);
  if (!isVisible) return null;

  const logoStateClass = logoReturning
    ? " is-showing"
    : logoHiding
      ? " is-hiding"
      : "";
  const view = SCREEN_VIEWS[activeView];
  const contentStateClass = logoHiding && !logoReturning
    ? " is-visible"
    : " is-leaving";

  return (
    <section
      className={`monitor-immersive-shell${isClosing ? " is-closing" : ""}${logoReturning ? " is-logo-returning" : ""}`}
      aria-label="Pantalla interactiva de Chris"
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.animationName === "monitor-immersive-enter") {
          setLogoHiding(true);
          onEnterComplete();
        }
        if (event.animationName === "monitor-immersive-exit") {
          onExitComplete();
        }
      }}
      style={{
        "--monitor-origin-height": `${origin?.height ?? window.innerHeight}px`,
        "--monitor-origin-left": `${origin?.left ?? 0}px`,
        "--monitor-origin-top": `${origin?.top ?? 0}px`,
        "--monitor-origin-width": `${origin?.width ?? window.innerWidth}px`,
      }}
    >
      <div
        className={`monitor-app${contentStateClass}`}
        style={{ "--monitor-accent": view.accent }}
      >
        <header className="monitor-app-header">
          <button
            className="monitor-back-button"
            type="button"
            onClick={() => setLogoReturning(true)}
          >
            <span aria-hidden="true">←</span>
            Volver
          </button>
          <strong className="monitor-app-brand">Chris</strong>
          <nav className="monitor-app-navigation" aria-label="Secciones de la pantalla">
            {SCREEN_VIEWS.map((screenView, index) => (
              <button
                className="monitor-navigation-button"
                key={screenView.id}
                type="button"
                aria-pressed={index === activeView}
                onClick={() => onActiveViewChange(index)}
              >
                {screenView.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="monitor-app-content" key={view.id}>
          <section className="monitor-app-hero">
            <div className="monitor-app-copy">
              <p className="monitor-app-eyebrow">{view.eyebrow}</p>
              <h1>{view.title}</h1>
              <p className="monitor-app-description">{view.copy}</p>
            </div>
            <article className="monitor-stat-card">
              <span>{view.label}</span>
              <strong>{view.stat}</strong>
              <small>Actualizado ahora</small>
            </article>
          </section>

          <section className="monitor-content-grid" aria-label="Contenido editable">
            <article className="monitor-content-card is-wide">
              <div>
                <span className="monitor-card-label">Contenido principal</span>
                <h2>Espacio preparado para tus datos</h2>
              </div>
              <p>
                Esta sección ya es HTML real. Aquí podrás conectar tablas,
                formularios, filtros y cualquier operación de tu CRUD.
              </p>
            </article>
            <article className="monitor-content-card">
              <span className="monitor-card-label">Interfaz</span>
              <strong>Responsive</strong>
              <p>El contenido cambia de distribución según el tamaño disponible.</p>
            </article>
            <article className="monitor-content-card">
              <span className="monitor-card-label">Estado</span>
              <strong>Lista para crecer</strong>
              <p>Componentes independientes, editables y compatibles con React.</p>
            </article>
          </section>
        </main>
      </div>
      <div
        className={`monitor-logo-layer${logoStateClass}`}
        onAnimationEnd={(event) => {
          if (
            event.target === event.currentTarget
            && event.animationName === "monitor-logo-return"
          ) {
            onClose();
          }
        }}
      >
        <img src={chrisLogoWhiteUrl} alt="" aria-hidden="true" />
      </div>
    </section>
  );
}
