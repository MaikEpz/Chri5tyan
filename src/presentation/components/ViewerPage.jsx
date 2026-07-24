import { useCallback, useEffect, useState } from "react";
import {
  FULLSCREEN_SUGGESTION_KEY,
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
  const [isMobile, setIsMobile] = useState(() => (
    window.matchMedia("(pointer: coarse), (max-width: 768px)").matches
  ));
  const [suggestionDismissed, setSuggestionDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem(FULLSCREEN_SUGGESTION_KEY) === "true";
    } catch {
      return false;
    }
  });
  const handleWorldReady = useCallback(() => setWorldReady(true), []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(pointer: coarse), (max-width: 768px)");
    const handleMobileChange = () => setIsMobile(mobileQuery.matches);
    handleMobileChange();
    mobileQuery.addEventListener("change", handleMobileChange);
    return () => mobileQuery.removeEventListener("change", handleMobileChange);
  }, []);

  const dismissFullscreenSuggestion = useCallback(() => {
    setSuggestionDismissed(true);
    try {
      window.sessionStorage.setItem(FULLSCREEN_SUGGESTION_KEY, "true");
    } catch {
      // La sugerencia puede descartarse aunque el almacenamiento esté deshabilitado.
    }
  }, []);

  const acceptFullscreenSuggestion = useCallback(async () => {
    dismissFullscreenSuggestion();
    await fullscreen.toggle();
  }, [dismissFullscreenSuggestion, fullscreen.toggle]);

  const showFullscreenSuggestion = shouldShowFullscreenSuggestion({
    isFullscreen: fullscreen.isFullscreen,
    isMobile,
    isSupported: fullscreen.isSupported,
    monitorOpen: monitor.open,
    suggestionDismissed,
    worldReady
  });
  const showFullscreenButton = shouldShowFullscreenButton({
    isSupported: fullscreen.isSupported,
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
        onMonitorOpen={monitor.open}
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
      {fullscreen.error && !monitor.open && (
        <FullscreenError
          message={fullscreen.error}
          onDismiss={fullscreen.clearError}
        />
      )}
    </main>
  );
}

function FullscreenError({ message, onDismiss }) {
  return (
    <div className="fullscreen-error" role="status">
      <span>{message}</span>
      <button type="button" aria-label="Cerrar aviso" onClick={onDismiss}>×</button>
    </div>
  );
}

function FullscreenSuggestion({ onAccept, onDismiss }) {
  return (
    <aside
      className="fullscreen-suggestion"
      aria-labelledby="fullscreen-suggestion-title"
      aria-describedby="fullscreen-suggestion-description"
    >
      <div className="fullscreen-suggestion-icon" aria-hidden="true">⛶</div>
      <div className="fullscreen-suggestion-copy">
        <strong id="fullscreen-suggestion-title">Una mejor vista</strong>
        <p id="fullscreen-suggestion-description">
          Activa la pantalla completa para explorar el mundo con más espacio.
        </p>
      </div>
      <div className="fullscreen-suggestion-actions">
        <button
          className="fullscreen-suggestion-primary"
          type="button"
          onClick={onAccept}
        >
          Activar
        </button>
        <button
          className="fullscreen-suggestion-secondary"
          type="button"
          onClick={onDismiss}
        >
          Ahora no
        </button>
      </div>
    </aside>
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
