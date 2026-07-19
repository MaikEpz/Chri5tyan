import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function DynamicExposure() {
  useFrame(({ clock, gl }) => {
    const time = clock.getElapsedTime();
    const exposure =
      0.85
      + (Math.sin(time * 0.34) * 0.125)
      + (Math.sin((time * 0.13) + 1.7) * 0.045);
    gl.toneMappingExposure = THREE.MathUtils.clamp(exposure, 0.68, 1.02);
  });

  return null;
}
