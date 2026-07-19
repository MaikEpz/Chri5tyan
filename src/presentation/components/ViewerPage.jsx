import { Suspense, useCallback, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Loader, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { FullscreenMonitor } from "../../infrastructure/react-three/monitor/FullscreenMonitor.jsx";
import { CAMERA } from "../../infrastructure/react-three/sceneConfig.js";

export function ViewerPage({ modelAsset, SceneComponent }) {
  const { lowPowerMode, unrestrictedMobile } = getDevicePerformanceProfile();
  const fullQualityDpr = Math.min(window.devicePixelRatio || 2, unrestrictedMobile ? 3 : 2);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorClosing, setMonitorClosing] = useState(false);
  const [monitorContentVisible, setMonitorContentVisible] = useState(false);
  const [monitorOrigin, setMonitorOrigin] = useState(null);
  const [monitorReady, setMonitorReady] = useState(false);
  const [monitorSnapshot, setMonitorSnapshot] = useState(null);
  const [activeMonitorView, setActiveMonitorView] = useState(0);
  const finishMonitorClose = useCallback(() => {
    setMonitorClosing(false);
    setMonitorContentVisible(false);
    setMonitorOpen(false);
    setMonitorOrigin(null);
    setMonitorReady(false);
    setMonitorSnapshot(null);
    setActiveMonitorView(0);
  }, []);
  const handleMonitorClose = useCallback(() => {
    if (monitorReady && monitorSnapshot) {
      setMonitorContentVisible(false);
      window.requestAnimationFrame(() => {
        setMonitorClosing(true);
      });
      return;
    }
    finishMonitorClose();
  }, [finishMonitorClose, monitorReady, monitorSnapshot]);
  const handleMonitorOpen = useCallback(() => {
    setMonitorClosing(false);
    setMonitorContentVisible(false);
    setMonitorReady(false);
    setMonitorOpen(true);
  }, []);
  const handleMonitorReady = useCallback((origin) => {
    setMonitorOrigin(origin);
    setMonitorReady(true);
  }, []);

  return (
    <main className="viewer-shell">
      <section className="viewer-stage" aria-label={`Visor 3D del modelo ${modelAsset.name}`}>
        <Canvas
          className="viewer-canvas"
          camera={{ fov: 58, near: 0.1, far: 1000, position: CAMERA.position.toArray() }}
          dpr={lowPowerMode ? [0.6, 1] : [1, fullQualityDpr]}
          gl={{
            antialias: !lowPowerMode,
            alpha: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.AgXToneMapping;
            gl.toneMappingExposure = 0.85;
          }}
          shadows={lowPowerMode ? false : "percentage"}
        >
          <color attach="background" args={["#050607"]} />
          <DynamicExposure />
          <PerformanceMonitor>
            {!unrestrictedMobile && <AdaptiveDpr />}
            <Suspense fallback={null}>
              <SceneComponent
                activeMonitorView={activeMonitorView}
                lowPowerMode={lowPowerMode}
                modelAsset={modelAsset}
                monitorContentVisible={monitorContentVisible}
                monitorOpen={monitorOpen}
                onActiveMonitorViewChange={setActiveMonitorView}
                onMonitorClose={handleMonitorClose}
                onMonitorOpen={handleMonitorOpen}
                onMonitorReady={handleMonitorReady}
                onMonitorSnapshot={setMonitorSnapshot}
              />
            </Suspense>
          </PerformanceMonitor>
        </Canvas>
        <Loader
          containerStyles={{ background: "transparent", pointerEvents: "none" }}
          innerStyles={{ background: "rgba(31, 38, 35, 0.18)" }}
          barStyles={{ background: "#26342f" }}
          dataStyles={{ color: "#1f2623", fontSize: "14px" }}
          dataInterpolation={(progress) => `Cargando modelo 3D... ${progress.toFixed(0)}%`}
        />
        <div className="viewer-reticle" aria-hidden="true" />
      </section>
      <FullscreenMonitor
        activeView={activeMonitorView}
        isClosing={monitorClosing}
        isVisible={monitorOpen && monitorReady && Boolean(monitorSnapshot)}
        origin={monitorOrigin}
        onActiveViewChange={setActiveMonitorView}
        onClose={handleMonitorClose}
        onEnterComplete={() => setMonitorContentVisible(true)}
        onExitComplete={finishMonitorClose}
      />
    </main>
  );
}

function getDevicePerformanceProfile() {
  const userAgent = navigator.userAgent;
  const isIPhone = /iPhone/i.test(userAgent);
  const isAndroidPhone = /Android/i.test(userAgent) && /Mobile/i.test(userAgent);
  const screenLongEdge = Math.max(window.screen.width, window.screen.height);
  const pixelRatio = window.devicePixelRatio || 1;
  const cpuCores = navigator.hardwareConcurrency || 0;
  const deviceMemory = navigator.deviceMemory || 0;

  // iPhone 14-class screens start at 390 × 844 with DPR 3. Safari does not
  // expose the exact iPhone model, so capability signals are more reliable.
  const modernIPhone =
    isIPhone &&
    screenLongEdge >= 844 &&
    pixelRatio >= 3;

  const highEndAndroid =
    isAndroidPhone &&
    screenLongEdge >= 800 &&
    pixelRatio >= 2.5 &&
    cpuCores >= 8 &&
    deviceMemory >= 6;

  const unrestrictedMobile = modernIPhone || highEndAndroid;
  const mobileLayout = window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;

  return {
    lowPowerMode: mobileLayout && !unrestrictedMobile,
    unrestrictedMobile,
  };
}

function DynamicExposure() {
  useFrame(({ clock, gl }) => {
    const time = clock.getElapsedTime();
    const exposure = 0.85 + Math.sin(time * 0.34) * 0.125 + Math.sin(time * 0.13 + 1.7) * 0.045;
    gl.toneMappingExposure = THREE.MathUtils.clamp(exposure, 0.68, 1.02);
  });

  return null;
}
