import { Suspense, useEffect, useRef } from "react";
import { AdaptiveDpr, PerformanceMonitor, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import chrisLogoUrl from "../../assets/branding/chris-logo.svg";
import { getDevicePerformanceProfile } from "../browser/devicePerformance.js";
import { ViewerScene } from "./ViewerScene.jsx";
import { DynamicExposure } from "./effects/DynamicExposure.jsx";
import { CAMERA } from "./sceneConfig.js";

function LogoLoader({ onWorldReady }) {
  const { active, progress, total } = useProgress();
  const loadingStartedRef = useRef(false);
  const readyNotifiedRef = useRef(false);
  const boundedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (active || total > 0) {
      loadingStartedRef.current = true;
    }

    if (
      loadingStartedRef.current
      && !active
      && progress >= 100
      && !readyNotifiedRef.current
    ) {
      readyNotifiedRef.current = true;
      onWorldReady?.();
    }
  }, [active, onWorldReady, progress, total]);

  if (!active) {
    return null;
  }

  return (
    <div className="logo-loader" role="status" aria-label="Cargando modelo 3D">
      <div
        className="logo-loader-mark"
        style={{ "--logo-load-progress": `${boundedProgress}%` }}
        aria-hidden="true"
      >
        <img className="logo-loader-base" src={chrisLogoUrl} alt="" />
        <img className="logo-loader-fill" src={chrisLogoUrl} alt="" />
      </div>
      <span className="logo-loader-label">Cargando</span>
    </div>
  );
}

export function ReactThreeViewport({
  modelAsset,
  activeMonitorView,
  cameraResetKey,
  monitorContentVisible,
  onActiveMonitorViewChange,
  onMonitorClose,
  onMonitorOpen,
  onMonitorReady,
  onWorldReady,
}) {
  const performance = getDevicePerformanceProfile();

  return (
    <section className="viewer-stage" aria-label={`Visor 3D del modelo ${modelAsset.name}`}>
      <Canvas
        className="viewer-canvas"
        camera={{
          fov: 58,
          near: 0.1,
          far: 1000,
          position: CAMERA.position.toArray(),
        }}
        dpr={performance.lowPowerMode ? [0.6, 1] : [1, performance.maximumPixelRatio]}
        gl={{
          antialias: !performance.lowPowerMode,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = 0.85;
        }}
        shadows={performance.lowPowerMode ? false : "percentage"}
      >
        <color attach="background" args={["#050607"]} />
        <DynamicExposure />
        <PerformanceMonitor>
          {!performance.unrestrictedMobile && <AdaptiveDpr />}
          <Suspense fallback={null}>
            <ViewerScene
              activeMonitorView={activeMonitorView}
              cameraResetKey={cameraResetKey}
              lowPowerMode={performance.lowPowerMode}
              modelAsset={modelAsset}
              monitorContentVisible={monitorContentVisible}
              onActiveMonitorViewChange={onActiveMonitorViewChange}
              onMonitorClose={onMonitorClose}
              onMonitorOpen={onMonitorOpen}
              onMonitorReady={onMonitorReady}
            />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
      <LogoLoader onWorldReady={onWorldReady} />
    </section>
  );
}
