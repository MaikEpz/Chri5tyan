import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollLookControls } from "./controls/ScrollLookControls.jsx";
import { AmbientDust } from "./effects/AmbientDust.jsx";
import { SceneLighting } from "./lights/SceneLighting.jsx";
import { LoadedModel } from "./model/LoadedModel.jsx";
import { MonitorScreen } from "./monitor/MonitorScreen.jsx";
import { CAMERA } from "./sceneConfig.js";

const CAMERA_POSITION = CAMERA.position.toArray();
const CAMERA_TARGET = CAMERA.target.toArray();
const DESKTOP_SCREEN = "desktop";
const PHONE_SCREEN = "phone";

export function ViewerScene({
  activeMonitorView = 0,
  cameraResetKey = 0,
  lowPowerMode = false,
  modelAsset,
  monitorContentVisible = false,
  onActiveMonitorViewChange = () => {},
  onMonitorClose = () => {},
  onMonitorOpen = () => {},
  onMonitorReady = () => {},
}) {
  const [modelReady, setModelReady] = useState(false);
  const [screenAnchor, setScreenAnchor] = useState(null);
  const [phoneScreenAnchor, setPhoneScreenAnchor] = useState(null);
  const [focusedScreen, setFocusedScreen] = useState(null);
  const [phoneUnlocking, setPhoneUnlocking] = useState(false);
  const [hasModelLights, setHasModelLights] = useState(false);
  const [viewResetKey, setViewResetKey] = useState(0);
  const phoneUnlockTimeoutRef = useRef(null);
  const lastCameraResetKeyRef = useRef(cameraResetKey);
  const handleModelReady = useCallback(() => setModelReady(true), []);
  const handleScreenOpen = useCallback((screen) => {
    setFocusedScreen(screen);
    onMonitorOpen(screen);
  }, [onMonitorOpen]);
  const handleScreenFocus = useCallback((screen) => setFocusedScreen(screen), []);
  const handleReturnToNormal = useCallback(() => {
    window.clearTimeout(phoneUnlockTimeoutRef.current);
    phoneUnlockTimeoutRef.current = null;
    setPhoneUnlocking(false);
    setFocusedScreen(null);
    onMonitorClose();
    setViewResetKey((currentKey) => currentKey + 1);
  }, [onMonitorClose]);
  const handleFocusComplete = useCallback((origin) => {
    window.clearTimeout(phoneUnlockTimeoutRef.current);
    phoneUnlockTimeoutRef.current = null;

    if (focusedScreen !== PHONE_SCREEN) {
      onMonitorReady(origin);
      return;
    }

    setPhoneUnlocking(true);
    phoneUnlockTimeoutRef.current = window.setTimeout(() => {
      setPhoneUnlocking(false);
      phoneUnlockTimeoutRef.current = null;
      onMonitorReady(origin);
    }, 720);
  }, [focusedScreen, onMonitorReady]);

  useEffect(() => {
    if (cameraResetKey === lastCameraResetKeyRef.current) return;
    lastCameraResetKeyRef.current = cameraResetKey;
    window.clearTimeout(phoneUnlockTimeoutRef.current);
    phoneUnlockTimeoutRef.current = null;
    setPhoneUnlocking(false);
    setFocusedScreen(null);
    setViewResetKey((currentKey) => currentKey + 1);
  }, [cameraResetKey]);

  useEffect(
    () => () => window.clearTimeout(phoneUnlockTimeoutRef.current),
    [],
  );

  const activeAnchor = focusedScreen === PHONE_SCREEN ? phoneScreenAnchor : screenAnchor;

  return (
    <>
      <SceneLighting useFallback={!hasModelLights} />
      {!lowPowerMode && <AmbientDust />}
      <LoadedModel
        lowPowerMode={lowPowerMode}
        source={modelAsset.source}
        onReady={handleModelReady}
        onScreenAnchor={setScreenAnchor}
        onPhoneScreenAnchor={setPhoneScreenAnchor}
        onExportedLightsChange={setHasModelLights}
      />
      <MonitorScreen
        activeView={activeMonitorView}
        anchor={screenAnchor}
        animateCtaDots
        idleCta="Cargando"
        isOpen={monitorContentVisible && focusedScreen === DESKTOP_SCREEN}
        isFocused={focusedScreen === DESKTOP_SCREEN}
        onActiveViewChange={onActiveMonitorViewChange}
        onClose={handleReturnToNormal}
        onFocusMonitor={() => handleScreenFocus(DESKTOP_SCREEN)}
        onLogoOpen={() => handleScreenOpen(DESKTOP_SCREEN)}
      />
      <MonitorScreen
        activeView={activeMonitorView}
        anchor={phoneScreenAnchor}
        cornerRadius={0.055}
        contentScaleY={0.95}
        glowColor="#ffffff"
        idleBackground="#000000"
        idleCta=""
        idleHitAreaHeightScale={1.344}
        idleHitAreaWidthScale={1.86}
        idleTextColor="#ffffff"
        isOpen={monitorContentVisible && focusedScreen === PHONE_SCREEN}
        isFocused={focusedScreen === PHONE_SCREEN}
        logoColor="#ffffff"
        screenDepthTest={false}
        showUnlockBar
        unlocking={phoneUnlocking}
        onActiveViewChange={onActiveMonitorViewChange}
        onClose={handleReturnToNormal}
        onFocusMonitor={() => handleScreenFocus(PHONE_SCREEN)}
        onLogoOpen={() => handleScreenOpen(PHONE_SCREEN)}
      />
      <ScrollLookControls
        cameraPosition={CAMERA_POSITION}
        cameraTarget={CAMERA_TARGET}
        enabled={modelReady}
        focusAnchor={focusedScreen ? activeAnchor : null}
        onFocusComplete={handleFocusComplete}
        resetKey={viewResetKey}
      />
    </>
  );
}
