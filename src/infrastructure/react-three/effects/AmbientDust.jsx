import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const PARTICLE_COUNT = 32;

export function AmbientDust() {
  const pointsRef = useRef(null);
  const positionAttributeRef = useRef(null);
  const { positions, velocities } = useMemo(() => createDustParticles(), []);

  useFrame(({ camera, clock }, delta) => {
    const attribute = positionAttributeRef.current;
    const points = pointsRef.current;
    if (!attribute || !points) return;

    points.position.copy(camera.position);
    points.quaternion.copy(camera.quaternion);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const offset = index * 3;
      positions[offset] += velocities[offset] * delta;
      positions[offset + 1] += velocities[offset + 1] * delta;
      positions[offset + 2] += velocities[offset + 2] * delta;

      if (positions[offset + 2] > -1.5) {
        const depth = 11 + (index % 4) * 0.35;
        positions[offset + 2] = -depth;
        positions[offset] = Math.sin(index * 12.91 + clock.elapsedTime) * depth * 0.68;
        positions[offset + 1] = Math.cos(index * 8.37 + clock.elapsedTime) * depth * 0.34;
      }

      const depth = -positions[offset + 2];
      const horizontalLimit = depth * 0.78;
      const verticalLimit = depth * 0.42;
      if (positions[offset] > horizontalLimit) positions[offset] = -horizontalLimit;
      if (positions[offset + 1] > verticalLimit) positions[offset + 1] = -verticalLimit;
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={positionAttributeRef} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e6ecef" depthWrite={false} opacity={0.24} size={0.018} sizeAttenuation transparent />
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
    const depth = 2 + random() * 10;
    positions[offset] = (random() - 0.5) * depth * 1.5;
    positions[offset + 1] = (random() - 0.5) * depth * 0.8;
    positions[offset + 2] = -depth;
    velocities[offset] = 0.015 + random() * 0.025;
    velocities[offset + 1] = 0.02 + random() * 0.035;
    velocities[offset + 2] = 0.045 + random() * 0.055;
  }

  return { positions, velocities };
}
