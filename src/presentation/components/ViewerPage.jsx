import { useCallback, useEffect, useState } from "react";
import {
  shouldShowFullscreenButton,
  shouldShowFullscreenSuggestion,
} from "../fullscreenUi.js";
import { useFullscreenMode } from "../hooks/useFullscreenMode.js";
import { useMonitorExperience } from "../hooks/useMonitorExperience.js";
import { FullscreenMonitor } from "./monitor/FullscreenMonitor.jsx";

export function ViewerPage({ modelAsset, ViewportComponent }) {
  const fullscreen = useFullscreenMode();
  const monitor = useMonitorExperience();
  const [worldReady, setWorldReady] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
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

  const showFullscreenSuggestion = shouldShowFullscreenSuggestion({
    isFullscreen: fullscreen.isFullscreen,
    isMobile,
    monitorOpen: monitor.open,
    suggestionDismissed,
    worldReady,
  });
  const showFullscreenButton = shouldShowFullscreenButton({
    monitorOpen: monitor.open,
  });

  return (
    <main className="viewer-shell">
      <ViewportComponent
        modelAsset={modelAsset}
        activeMonitorView={monitor.activeView}
        cameraResetKey={monitor.cameraResetKey}
        monitorContentVisible={monitor.contentVisible}
        onActiveMonitorViewChange={monitor.setActiveView}
        onMonitorClose={monitor.requestClose}
        onMonitorOpen={monitor.openMonitor}
        onMonitorReady={monitor.markReady}
        onWorldReady={handleWorldReady}
      />
      <FullscreenMonitor
        isClosing={monitor.closing}
        isVisible={monitor.open && monitor.ready}
        origin={monitor.origin}
        source={monitor.source}
        onClose={monitor.requestClose}
        onEnterComplete={monitor.showContent}
        onExitComplete={monitor.finishClose}
      />
      {showFullscreenSuggestion && (
        <FullscreenSuggestion
          onAccept={acceptFullscreenSuggestion}
          onDismiss={dismissFullscreenSuggestion}
        />
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
        <span className="fullscreen-suggestion-icon" aria-hidden="true">⛶</span>
        <p className="fullscreen-suggestion-eyebrow">Experiencia inmersiva</p>
        <h1 id="fullscreen-suggestion-title">¿Activar pantalla completa?</h1>
        <p id="fullscreen-suggestion-description">
          Disfruta el mundo 3D usando todo el espacio disponible en tu pantalla.
        </p>
        <div className="fullscreen-suggestion-actions">
          <button type="button" className="fullscreen-suggestion-primary" onClick={onAccept}>
            Activar pantalla completa
          </button>
          <button type="button" className="fullscreen-suggestion-secondary" onClick={onDismiss}>
            Continuar sin activar
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
      {isFullscreen ? "Salir" : "Pantalla completa"}
    </button>
  );
}
