import { useFullscreenMode } from "../hooks/useFullscreenMode.js";
import { useMonitorExperience } from "../hooks/useMonitorExperience.js";
import { FullscreenMonitor } from "./monitor/FullscreenMonitor.jsx";

export function ViewerPage({ modelAsset, ViewportComponent }) {
  const fullscreen = useFullscreenMode();
  const monitor = useMonitorExperience();

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
      {fullscreen.isSupported && (
        <FullscreenButton
          isFullscreen={fullscreen.isFullscreen}
          onToggle={fullscreen.toggle}
        />
      )}
    </main>
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
