import { useEffect, useRef, useState } from "react";
import { useFullscreenMode } from "../hooks/useFullscreenMode.js";
import { useMobileLandscape } from "../hooks/useMobileLandscape.js";
import { useMonitorExperience } from "../hooks/useMonitorExperience.js";
import { FullscreenMonitor } from "./monitor/FullscreenMonitor.jsx";

export function ViewerPage({ modelAsset, ViewportComponent }) {
  const fullscreen = useFullscreenMode();
  const mobileLandscape = useMobileLandscape();
  const monitor = useMonitorExperience();
  const [orientationSettling, setOrientationSettling] = useState(false);
  const previousPortraitRef = useRef(mobileLandscape.isPortrait);
  const shouldRequestLandscape = mobileLandscape.requiresLandscape && !monitor.isOpen;

  useEffect(() => {
    const changedToLandscape = previousPortraitRef.current && !mobileLandscape.isPortrait;
    previousPortraitRef.current = mobileLandscape.isPortrait;

    if (!mobileLandscape.isPhone || !changedToLandscape || monitor.isOpen) return undefined;

    setOrientationSettling(true);
    monitor.resetCamera();
    const settleTimeout = window.setTimeout(() => setOrientationSettling(false), 650);

    return () => window.clearTimeout(settleTimeout);
  }, [mobileLandscape.isPhone, mobileLandscape.isPortrait, monitor.isOpen, monitor.resetCamera]);

  const worldInteractionBlocked = shouldRequestLandscape || orientationSettling;

  return (
    <main className={`viewer-shell${monitor.isOpen ? " is-monitor-open" : ""}${orientationSettling ? " is-orientation-settling" : ""}`}>
      <div
        className="viewer-world"
        aria-hidden={shouldRequestLandscape || undefined}
        inert={worldInteractionBlocked || undefined}
      >
        <ViewportComponent
          modelAsset={modelAsset}
          activeMonitorView={monitor.activeView}
          cameraResetKey={monitor.cameraResetKey}
          monitorContentVisible={monitor.contentVisible}
          onActiveMonitorViewChange={monitor.setActiveView}
          onMonitorClose={monitor.requestClose}
          onMonitorOpen={monitor.open}
          onMonitorReady={monitor.markReady}
        />
      </div>
      <FullscreenMonitor
        isClosing={monitor.closing}
        isVisible={monitor.isOpen && monitor.ready}
        origin={monitor.origin}
        source={monitor.source}
        onClose={monitor.requestClose}
        onEnterComplete={monitor.showContent}
        onExitComplete={monitor.finishClose}
      />
      <LandscapeOrientationNotice />
      {fullscreen.isSupported && !worldInteractionBlocked && (
        <FullscreenButton
          isFullscreen={fullscreen.isFullscreen}
          onToggle={fullscreen.toggle}
        />
      )}
    </main>
  );
}

function LandscapeOrientationNotice() {
  return (
    <section
      className="landscape-orientation-notice"
      role="dialog"
      aria-label="Orientación horizontal requerida"
      aria-live="polite"
    >
      <div className="landscape-orientation-icon" aria-hidden="true">
        <span />
      </div>
      <p>Gira tu celular para continuar</p>
      <small>El mundo 3D está diseñado para verse en horizontal.</small>
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
