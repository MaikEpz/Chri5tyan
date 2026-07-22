import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_PORTRAIT_DISTANCE_SCALE,
  MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET,
  getResponsiveCameraView,
} from "../../src/infrastructure/react-three/cameraView.js";
import { CAMERA } from "../../src/infrastructure/react-three/sceneConfig.js";

test("aleja la camara un 45 por ciento en celulares verticales", () => {
  const view = getResponsiveCameraView(390, 844);
  const basePosition = CAMERA.position.toArray();
  const target = CAMERA.target.toArray();

  assert.equal(view.isMobilePortrait, true);
  view.position.forEach((coordinate, index) => {
    const expected = target[index]
      + (basePosition[index] - target[index]) * MOBILE_PORTRAIT_DISTANCE_SCALE;
    assert.ok(Math.abs(coordinate - expected) < Number.EPSILON);
  });
});

test("orienta el encuadre inicial hacia el iPhone en movil vertical", () => {
  const view = getResponsiveCameraView(390, 844);
  const basePosition = CAMERA.position.toArray();
  const baseTarget = CAMERA.target.toArray();
  const forwardX = baseTarget[0] - basePosition[0];
  const forwardZ = baseTarget[2] - basePosition[2];
  const horizontalLength = Math.hypot(forwardX, forwardZ);

  assert.deepEqual(view.target, [
    baseTarget[0] + (-forwardZ / horizontalLength) * MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET,
    baseTarget[1],
    baseTarget[2] + (forwardX / horizontalLength) * MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET,
  ]);
});

test("aplica el encuadre vertical al iPhone de mayor ancho previsto", () => {
  assert.equal(getResponsiveCameraView(430, 932).isMobilePortrait, true);
});

test("conserva la camara original en celular horizontal", () => {
  const view = getResponsiveCameraView(844, 390);

  assert.equal(view.isMobilePortrait, false);
  assert.deepEqual(view.position, CAMERA.position.toArray());
  assert.deepEqual(view.target, CAMERA.target.toArray());
});

test("conserva la camara original desde 768 pixeles de ancho", () => {
  const view = getResponsiveCameraView(768, 1024);

  assert.equal(view.isMobilePortrait, false);
  assert.deepEqual(view.position, CAMERA.position.toArray());
});
