import { Suspense } from "react";
import { AdaptiveDpr, Loader, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ViewerScene } from "./ViewerScene.jsx";
import { DynamicExposure } from "./effects/DynamicExposure.jsx";
import { CAMERA } from "./sceneConfig.js";

export function ReactThreeViewport({
  modelAsset,
  activeMonitorView,
  cameraResetKey,
  monitorContentVisible,
  onActiveMonitorViewChange,
  onMonitorClose,
  onMonitorOpen,
  onMonitorReady,
}) {
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
        dpr={[1, 3]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = 0.85;
        }}
        shadows="percentage"
      >
        <color attach="background" args={["#050607"]} />
        <DynamicExposure />
        <PerformanceMonitor>
          <AdaptiveDpr />
          <Suspense fallback={null}>
            <ViewerScene
              activeMonitorView={activeMonitorView}
              cameraResetKey={cameraResetKey}
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
      <Loader
        containerStyles={{ background: "transparent", pointerEvents: "none" }}
        innerStyles={{ background: "rgba(31, 38, 35, 0.18)" }}
        barStyles={{ background: "#26342f" }}
        dataStyles={{ color: "#1f2623", fontSize: "14px" }}
        dataInterpolation={(progress) => `Cargando modelo 3D... ${progress.toFixed(0)}%`}
      />
    </section>
  );
}
