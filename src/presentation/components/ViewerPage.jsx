import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Loader, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { CAMERA } from "../../infrastructure/react-three/sceneConfig.js";

export function ViewerPage({ modelAsset, SceneComponent }) {
  return (
    <main className="viewer-shell">
      <section className="viewer-stage" aria-label={`Visor 3D del modelo ${modelAsset.name}`}>
        <Canvas
          className="viewer-canvas"
          camera={{ fov: 58, near: 0.1, far: 1000, position: CAMERA.position.toArray() }}
          dpr={[1, 2]}
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
              <SceneComponent modelAsset={modelAsset} />
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
    </main>
  );
}

function DynamicExposure() {
  useFrame(({ clock, gl }) => {
    const time = clock.getElapsedTime();
    const exposure = 0.85 + Math.sin(time * 0.34) * 0.065 + Math.sin(time * 0.13 + 1.7) * 0.025;
    gl.toneMappingExposure = THREE.MathUtils.clamp(exposure, 0.76, 0.94);
  });

  return null;
}
