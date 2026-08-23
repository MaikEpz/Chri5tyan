import * as THREE from "three";

// Lowering the radial vanishing point moves the occluded streaks upward while
// keeping the light source tied to Spot.001.
export const WINDOW_LIGHT_SCREEN_Y_OFFSET = -0.04;
export const PORTRAIT_LIGHT_SCREEN_LIMITS = Object.freeze({ x: 1.04, y: 0.84 });

export function findWindowSpotlight(scene) {
  let preferred = null;
  let fallback = null;
  scene?.traverse?.((object) => {
    if (!object.isSpotLight) return;
    fallback ??= object;
    if (preferred) return;
    let current = object;
    while (current) {
      if (current.name === "Spot.001") {
        preferred = object;
        return;
      }
      current = current.parent;
    }
  });
  return preferred ?? fallback;
}

export function getStableWindowLightScreenPosition(
  spotlight,
  camera,
  target = new THREE.Vector3(),
) {
  spotlight.getWorldPosition(target).project(camera);

  target.x = (target.x + 1) * 0.5;
  target.y = (target.y + 1) * 0.5 + WINDOW_LIGHT_SCREEN_Y_OFFSET;
  if (camera.aspect < 0.9) {
    target.x = Math.min(target.x, PORTRAIT_LIGHT_SCREEN_LIMITS.x);
    target.y = Math.min(target.y, PORTRAIT_LIGHT_SCREEN_LIMITS.y);
  }
  target.z = 1000;
  return target;
}
