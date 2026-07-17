import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

export function ModelLightRig({ lights }) {
  return (
    <>
      {lights.points.map((light) => (
        <group key={light.id}>
          <LampSpotLight light={light} />
          <mesh position={light.position} scale={light.glowScale}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshBasicMaterial
              color={light.color}
              transparent
              opacity={0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function LampSpotLight({ light }) {
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  return (
    <>
      <spotLight
        ref={lightRef}
        position={light.position}
        color={light.color}
        intensity={light.intensity}
        distance={light.distance}
        angle={0.46}
        penumbra={0.88}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <object3D ref={targetRef} position={light.target} />
    </>
  );
}
