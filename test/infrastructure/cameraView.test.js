import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_PORTRAIT_DISTANCE_SCALE,
  MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET,
  MOBILE_PORTRAIT_YAW_OFFSET,
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

test("gira el encuadre vertical un grado a la izquierda", () => {
  const view = getResponsiveCameraView(390, 844);
  const basePosition = CAMERA.position.toArray();
  const baseTarget = CAMERA.target.toArray();
  const forwardX = baseTarget[0] - basePosition[0];
  const forwardZ = baseTarget[2] - basePosition[2];
  const horizontalLength = Math.hypot(forwardX, forwardZ);
  const portraitPosition = basePosition.map((coordinate, index) => (
    baseTarget[index]
      + (coordinate - baseTarget[index]) * MOBILE_PORTRAIT_DISTANCE_SCALE
  ));
  const offsetTarget = [
    baseTarget[0] + (-forwardZ / horizontalLength) * MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET,
    baseTarget[1],
    baseTarget[2] + (forwardX / horizontalLength) * MOBILE_PORTRAIT_TARGET_RIGHT_OFFSET,
  ];
  const directionX = offsetTarget[0] - portraitPosition[0];
  const directionZ = offsetTarget[2] - portraitPosition[2];

  assert.ok(Math.abs(view.target[0] - (
    portraitPosition[0]
      + directionX * Math.cos(MOBILE_PORTRAIT_YAW_OFFSET)
      + directionZ * Math.sin(MOBILE_PORTRAIT_YAW_OFFSET)
  )) < Number.EPSILON);
  assert.equal(view.target[1], offsetTarget[1]);
  assert.ok(Math.abs(view.target[2] - (
    portraitPosition[2]
      - directionX * Math.sin(MOBILE_PORTRAIT_YAW_OFFSET)
      + directionZ * Math.cos(MOBILE_PORTRAIT_YAW_OFFSET)
  )) < Number.EPSILON);
  assert.equal(MOBILE_PORTRAIT_YAW_OFFSET, Math.PI / 180);
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
