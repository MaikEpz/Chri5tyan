import { useCallback, useEffect, useState } from "react";
import { ScrollLookControls } from "./controls/ScrollLookControls.jsx";
import { AmbientDust } from "./effects/AmbientDust.jsx";
import { SceneLighting } from "./lights/SceneLighting.jsx";
import { LoadedModel } from "./model/LoadedModel.jsx";
import { MonitorScreen } from "./monitor/MonitorScreen.jsx";
import { CAMERA } from "./sceneConfig.js";

const CAMERA_POSITION = CAMERA.position.toArray();
const CAMERA_TARGET = CAMERA.target.toArray();

export function ViewerScene({
  activeMonitorView = 0,
  lowPowerMode = false,
  modelAsset,
  monitorContentVisible = false,
  monitorOpen = false,
  onActiveMonitorViewChange = () => {},
  onMonitorClose = () => {},
  onMonitorOpen = () => {},
  onMonitorReady = () => {},
  onMonitorSnapshot = () => {},
}) {
  const [modelReady, setModelReady] = useState(false);
  const [screenAnchor, setScreenAnchor] = useState(null);
  const [monitorFocused, setMonitorFocused] = useState(false);
  const [hasModelLights, setHasModelLights] = useState(false);
  const [viewResetKey, setViewResetKey] = useState(0);
  const handleModelReady = useCallback(() => setModelReady(true), []);
  const handleMonitorOpen = useCallback(() => {
    setMonitorFocused(true);
    onMonitorOpen();
  }, [onMonitorOpen]);
  const handleMonitorFocus = useCallback(() => setMonitorFocused(true), []);
  const handleReturnToNormal = useCallback(() => {
    setMonitorFocused(false);
    onMonitorClose();
    setViewResetKey((currentKey) => currentKey + 1);
  }, [onMonitorClose]);

  useEffect(() => {
    if (monitorOpen || !monitorFocused) return;
    setMonitorFocused(false);
    setViewResetKey((currentKey) => currentKey + 1);
  }, [monitorFocused, monitorOpen]);

  return (
    <>
      <SceneLighting useFallback={!hasModelLights} />
      {!lowPowerMode && <AmbientDust />}
      <LoadedModel
        lowPowerMode={lowPowerMode}
        source={modelAsset.source}
        onReady={handleModelReady}
        onScreenAnchor={setScreenAnchor}
        onExportedLightsChange={setHasModelLights}
      />
      <MonitorScreen
        activeView={activeMonitorView}
        anchor={screenAnchor}
        isOpen={monitorContentVisible}
        isFocused={monitorFocused}
        onActiveViewChange={onActiveMonitorViewChange}
        onClose={handleReturnToNormal}
        onFocusMonitor={handleMonitorFocus}
        onLogoOpen={handleMonitorOpen}
        onScreenSnapshot={onMonitorSnapshot}
      />
      <ScrollLookControls
        cameraPosition={CAMERA_POSITION}
        cameraTarget={CAMERA_TARGET}
        enabled={modelReady}
        focusAnchor={monitorFocused ? screenAnchor : null}
        onFocusComplete={onMonitorReady}
        resetKey={viewResetKey}
      />
    </>
  );
}
