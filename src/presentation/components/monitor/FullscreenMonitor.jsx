import { lazy, Suspense, useEffect, useState } from "react";
import chrisLogoWhiteUrl from "../../../assets/branding/chris-logo.svg";

const ProductionWorkspace = lazy(() => (
  import("../../features/workspace/ProductionWorkspace.jsx")
    .then((module) => ({ default: module.ProductionWorkspace }))
));
const PhonePortfolioWorkspace = lazy(() => (
  import("../../features/portfolio/PhonePortfolioWorkspace.jsx")
    .then((module) => ({ default: module.PhonePortfolioWorkspace }))
));
const IMMERSIVE_EXIT_DURATION_MS = 900;
const PHONE_EXIT_DURATION_MS = 720;
const EXIT_COMPLETION_GRACE_MS = 80;

export function FullscreenMonitor({
  isClosing = false,
  isVisible = false,
  origin = null,
  source = "desktop",
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

  useEffect(() => {
    if (!isClosing) return undefined;

    const completionTimeout = window.setTimeout(
      onExitComplete,
      (source === "phone" ? PHONE_EXIT_DURATION_MS : IMMERSIVE_EXIT_DURATION_MS)
        + EXIT_COMPLETION_GRACE_MS,
    );
    return () => window.clearTimeout(completionTimeout);
  }, [isClosing, onExitComplete, source]);

  if (!isVisible) return null;

  const logoStateClass = logoReturning
    ? " is-showing"
    : logoHiding
      ? " is-hiding"
      : "";
  const contentStateClass = logoHiding && !logoReturning
    ? " is-visible"
    : " is-leaving";
  const ActiveWorkspace = source === "phone"
    ? PhonePortfolioWorkspace
    : ProductionWorkspace;

  return (
    <section
      className={`monitor-immersive-shell${source === "phone" ? " is-phone-source" : ""}${isClosing ? " is-closing" : ""}${logoReturning ? " is-logo-returning" : ""}`}
      aria-label="Pantalla interactiva de Chris"
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.animationName === "monitor-immersive-enter") {
          setLogoHiding(true);
          onEnterComplete();
        }
        if (
          event.animationName === "monitor-immersive-exit"
          || event.animationName === "phone-immersive-exit"
        ) {
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
      <div className={`monitor-app${contentStateClass}`}>
        <Suspense fallback={null}>
          <ActiveWorkspace onBack={() => setLogoReturning(true)} />
        </Suspense>
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
        <div className="monitor-logo-lockup">
          <img src={chrisLogoWhiteUrl} alt="" aria-hidden="true" />
          {source === "desktop" && !logoReturning && <span>Bienvenido</span>}
        </div>
      </div>
    </section>
  );
}
