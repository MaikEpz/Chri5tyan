import { CAMERA } from "./sceneConfig.js";

export const MOBILE_PORTRAIT_MAX_WIDTH = 767;
export const MOBILE_PORTRAIT_DISTANCE_SCALE = 1.45;
export const MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET = 1.1;

export function getResponsiveCameraView(width, height) {
  const target = CAMERA.target.toArray();
  const basePosition = CAMERA.position.toArray();
  const isMobilePortrait = width <= MOBILE_PORTRAIT_MAX_WIDTH && height > width;

  if (!isMobilePortrait) {
    return {
      isMobilePortrait,
      position: basePosition,
      target,
    };
  }

  const forwardX = target[0] - basePosition[0];
  const forwardZ = target[2] - basePosition[2];
  const horizontalLength = Math.hypot(forwardX, forwardZ);
  const right = [
    -forwardZ / horizontalLength,
    0,
    forwardX / horizontalLength,
  ];
  const portraitTarget = target.map((coordinate, index) => (
    coordinate + right[index] * MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET
  ));

  return {
    isMobilePortrait,
    position: basePosition.map((coordinate, index) => (
      target[index] + (coordinate - target[index]) * MOBILE_PORTRAIT_DISTANCE_SCALE
    )),
    target: portraitTarget,
  };
}
