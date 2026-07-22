import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { configureExportedLight } from "../../src/infrastructure/react-three/lights/lightUtils.js";

test("la luz blanca Point ilumina sin generar sombras", () => {
  const light = new THREE.SpotLight("#ffffff", 869.62262);
  light.name = "Point";

  configureExportedLight(light);

  assert.equal(light.castShadow, false);
  assert.equal(light.color.getHexString(), "ffffff");
  assert.equal(light.intensity, 869.62262);
});

test("la luz amarilla Spot.001 conserva sus sombras", () => {
  const light = new THREE.SpotLight("#ff4300", 1985.81213);
  light.name = "Spot.001";

  configureExportedLight(light);

  assert.equal(light.castShadow, true);
  assert.equal(light.color.getHexString(), "ff4300");
  assert.equal(light.intensity, 1985.81213);
});
