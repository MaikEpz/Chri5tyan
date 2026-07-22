import { useFullscreenMode } from "../hooks/useFullscreenMode.js";
import { useMobileLandscape } from "../hooks/useMobileLandscape.js";
import { useMonitorExperience } from "../hooks/useMonitorExperience.js";
import { FullscreenMonitor } from "./monitor/FullscreenMonitor.jsx";

export function ViewerPage({ modelAsset, ViewportComponent }) {
  const fullscreen = useFullscreenMode();
  const mobileLandscape = useMobileLandscape();
  const monitor = useMonitorExperience();
  const shouldRequestLandscape = mobileLandscape.requiresLandscape && !monitor.open;

  return (
    <main className="viewer-shell">
      <div
        className="viewer-world"
        aria-hidden={shouldRequestLandscape || undefined}
        inert={shouldRequestLandscape || undefined}
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
        isVisible={monitor.open && monitor.ready}
        origin={monitor.origin}
        source={monitor.source}
        onClose={monitor.requestClose}
        onEnterComplete={monitor.showContent}
        onExitComplete={monitor.finishClose}
      />
      {shouldRequestLandscape && <LandscapeOrientationNotice />}
      {fullscreen.isSupported && !shouldRequestLandscape && (
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
