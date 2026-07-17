import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const PARTICLE_COUNT = 32;

export function AmbientDust() {
  const positionAttributeRef = useRef(null);
  const { positions, velocities } = useMemo(() => createDustParticles(), []);

  useFrame((_, delta) => {
    const attribute = positionAttributeRef.current;
    if (!attribute) return;

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const offset = index * 3;
      positions[offset] += velocities[offset] * delta;
      positions[offset + 1] += velocities[offset + 1] * delta;
      positions[offset + 2] += velocities[offset + 2] * delta;

      if (positions[offset] > 12) positions[offset] = -14;
      if (positions[offset + 1] > 11) positions[offset + 1] = 1;
      if (positions[offset + 2] > 12) positions[offset + 2] = -16;
    }

    attribute.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={positionAttributeRef} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e6ecef" depthWrite={false} opacity={0.28} size={0.055} sizeAttenuation transparent />
    </points>
  );
}

function createDustParticles() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  let seed = 1847;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const offset = index * 3;
    positions[offset] = -14 + random() * 26;
    positions[offset + 1] = 1 + random() * 10;
    positions[offset + 2] = -16 + random() * 28;
    velocities[offset] = 0.035 + random() * 0.045;
    velocities[offset + 1] = 0.055 + random() * 0.065;
    velocities[offset + 2] = 0.02 + random() * 0.03;
  }

  return { positions, velocities };
}
