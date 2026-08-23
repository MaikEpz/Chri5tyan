import { Suspense, useCallback, useEffect, useState } from "react";
import {
  shouldShowFullscreenButton,
  shouldShowFullscreenSuggestion,
} from "../fullscreenUi.js";
import { useFullscreenMode } from "../hooks/useFullscreenMode.js";
import { useMonitorExperience } from "../hooks/useMonitorExperience.js";
import {
  shouldShowViewerOnboarding,
  viewerOnboardingStore,
} from "../viewerOnboarding.js";
import { FullscreenMonitor } from "./monitor/FullscreenMonitor.jsx";

export function ViewerPage({
  authSessionService,
  catalogService,
  createCinemaRequestUseCase,
  exportProductionQuoteUseCase,
  modelAsset,
  ViewportComponent,
}) {
  const fullscreen = useFullscreenMode();
  const monitor = useMonitorExperience();
  const [worldReady, setWorldReady] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [onboardingRequested, setOnboardingRequested] = useState(
    () => !viewerOnboardingStore.hasSeen(),
  );
  const [isMobile, setIsMobile] = useState(() => (
    window.matchMedia("(pointer: coarse), (max-width: 768px)").matches
  ));
  const handleWorldReady = useCallback(() => setWorldReady(true), []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(pointer: coarse), (max-width: 768px)");
    const handleMobileChange = () => setIsMobile(mobileQuery.matches);

    handleMobileChange();
    mobileQuery.addEventListener("change", handleMobileChange);
    return () => mobileQuery.removeEventListener("change", handleMobileChange);
  }, []);

  useEffect(() => {
    if (fullscreen.isFullscreen) {
      setSuggestionDismissed(true);
    }
  }, [fullscreen.isFullscreen]);

  const dismissFullscreenSuggestion = useCallback(() => {
    setSuggestionDismissed(true);
  }, []);

  const acceptFullscreenSuggestion = useCallback(() => {
    setSuggestionDismissed(true);
    void fullscreen.toggle();
  }, [fullscreen.toggle]);

  const completeOnboarding = useCallback(() => {
    viewerOnboardingStore.markSeen();
    setOnboardingRequested(false);
  }, []);

  const handleMonitorOpen = useCallback((source) => {
    completeOnboarding();
    monitor.openMonitor(source);
  }, [completeOnboarding, monitor.openMonitor]);

  const handleMonitorClose = useCallback(() => {
    monitor.requestClose();
  }, [monitor.requestClose]);

  const onboardingCandidate = shouldShowViewerOnboarding({
    monitorOpen: monitor.open,
    onboardingRequested,
    worldReady,
  });

  const showFullscreenSuggestion = shouldShowFullscreenSuggestion({
    isFullscreen: fullscreen.isFullscreen,
    isMobile,
    monitorOpen: monitor.open,
    suggestionDismissed,
    worldReady,
  });
  const showOnboarding = onboardingCandidate && !showFullscreenSuggestion;
  const showFullscreenButton = shouldShowFullscreenButton({ monitorOpen: monitor.open })
    && !showFullscreenSuggestion;
  const showHelpButton = worldReady
    && !monitor.open
    && !showFullscreenSuggestion;
  const toggleOnboarding = () => {
    if (showOnboarding) {
      completeOnboarding();
      return;
    }

    setOnboardingRequested(true);
  };
  return (
    <main className="viewer-shell">
      <Suspense fallback={<ViewerLoadingState modelName={modelAsset.name} />}>
        <ViewportComponent
          modelAsset={modelAsset}
          activeMonitorView={monitor.activeView}
          cameraResetKey={monitor.cameraResetKey}
          monitorContentVisible={monitor.contentVisible}
          onboardingVisible={showOnboarding}
          onActiveMonitorViewChange={monitor.setActiveView}
          onMonitorClose={handleMonitorClose}
          onMonitorOpen={handleMonitorOpen}
          onMonitorReady={monitor.markReady}
          onWorldReady={handleWorldReady}
        />
      </Suspense>
      <FullscreenMonitor
        authSessionService={authSessionService}
        catalogService={catalogService}
        createCinemaRequestUseCase={createCinemaRequestUseCase}
        exportProductionQuoteUseCase={exportProductionQuoteUseCase}
        isClosing={monitor.closing}
        isVisible={monitor.open && monitor.ready}
        origin={monitor.origin}
        source={monitor.source}
        onClose={handleMonitorClose}
        onEnterComplete={monitor.showContent}
        onExitComplete={monitor.finishClose}
      />
      {showFullscreenSuggestion && (
        <FullscreenSuggestion
          onAccept={acceptFullscreenSuggestion}
          onDismiss={dismissFullscreenSuggestion}
        />
      )}
      {showHelpButton && (
        <button
          className="viewer-help-toggle"
          type="button"
          aria-label={showOnboarding ? "Ocultar guía" : "Mostrar guía"}
          aria-pressed={showOnboarding}
          onClick={toggleOnboarding}
        >
          ?
        </button>
      )}
      {showFullscreenButton && (
        <FullscreenButton
          isFullscreen={fullscreen.isFullscreen}
          onToggle={fullscreen.toggle}
        />
      )}
    </main>
  );
}

function ViewerLoadingState({ modelName }) {
  return (
    <section className="viewer-stage grid place-items-center bg-[#050607]" aria-label={`Visor 3D del modelo ${modelName}`}>
      <span className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase" role="status">
        Preparando experiencia…
      </span>
    </section>
  );
}

function FullscreenSuggestion({ onAccept, onDismiss }) {
  return (
    <section
      className="fullscreen-suggestion"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-suggestion-title"
      aria-describedby="fullscreen-suggestion-description"
    >
      <div className="fullscreen-suggestion-content">
        <h1 id="fullscreen-suggestion-title">¿Pantalla completa?</h1>
        <p id="fullscreen-suggestion-description">
          Usa todo el espacio disponible.
        </p>
        <div className="fullscreen-suggestion-actions">
          <button type="button" className="fullscreen-suggestion-primary" onClick={onAccept}>
            Activar
          </button>
          <button type="button" className="fullscreen-suggestion-secondary" onClick={onDismiss}>
            Ahora no
          </button>
        </div>
      </div>
    </section>
  );
}

function FullscreenButton({ isFullscreen, onToggle }) {
  return (
    <button
      className="fullscreen-toggle"
      type="button"
      aria-label={isFullscreen ? "Salir de pantalla completa" : "Abrir en pantalla completa"}
      aria-pressed={isFullscreen}
      onClick={onToggle}
    >
      <span aria-hidden="true">{isFullscreen ? "×" : "⛶"}</span>
    </button>
  );
}
