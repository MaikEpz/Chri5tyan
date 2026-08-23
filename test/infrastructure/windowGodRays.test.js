import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  findWindowSpotlight,
  getStableWindowLightScreenPosition,
  PORTRAIT_LIGHT_SCREEN_LIMITS,
  WINDOW_LIGHT_SCREEN_Y_OFFSET,
} from "../../src/infrastructure/react-three/effects/windowGodRaysUtils.js";

test("selecciona Spot.001 y excluye la luz de relleno", () => {
  const scene = new THREE.Scene();
  const fill = new THREE.PointLight();
  fill.name = "Point";
  scene.add(fill);
  const exportedSpot = new THREE.Group();
  exportedSpot.name = "Spot.001";
  const spotlight = new THREE.SpotLight();
  exportedSpot.add(spotlight);
  scene.add(exportedSpot);

  assert.equal(findWindowSpotlight(scene), spotlight);
});

test("el origen se proyecta desde el foco y aplica el desplazamiento vertical", () => {
  const spotlight = new THREE.SpotLight();
  spotlight.position.set(4, 3, 2);
  spotlight.target.position.set(0, 0, 0);
  spotlight.updateMatrixWorld(true);
  spotlight.target.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const before = getStableWindowLightScreenPosition(spotlight, camera).clone();
  const rawProjection = spotlight.getWorldPosition(new THREE.Vector3()).project(camera);
  const expectedY = (rawProjection.y + 1) * 0.5 + WINDOW_LIGHT_SCREEN_Y_OFFSET;
  assert.ok(Math.abs(before.y - expectedY) < 1e-9);
  camera.position.add(new THREE.Vector3(2, 1, 0));
  camera.updateMatrixWorld(true);
  const after = getStableWindowLightScreenPosition(spotlight, camera).clone();

  assert.notEqual(after.x, before.x);
  assert.notEqual(after.y, before.y);
  assert.equal(after.z, 1000);
});

test("mantiene el origen volumétrico dentro del borde en retrato", () => {
  const spotlight = new THREE.SpotLight();
  spotlight.position.set(20, 30, 0);
  spotlight.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(50, 0.5, 0.1, 2000);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const projected = getStableWindowLightScreenPosition(spotlight, camera);

  assert.ok(projected.x <= PORTRAIT_LIGHT_SCREEN_LIMITS.x);
  assert.ok(projected.y <= PORTRAIT_LIGHT_SCREEN_LIMITS.y);
});
