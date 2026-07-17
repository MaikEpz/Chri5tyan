import * as THREE from "three";
import { EMISSIVE_LIGHT_MATERIALS } from "../sceneConfig.js";
import { getMaterialList } from "../model/modelUtils.js";

export function configureExportedLight(light) {
  const isScreenFillLight = light.isPointLight && (light.name === "Point" || light.name === "Point.004");
  light.castShadow = !isScreenFillLight && (light.isDirectionalLight || light.isPointLight || light.isSpotLight);

  if (light.shadow) {
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.radius = 2;
    light.shadow.bias = -0.00008;
    light.shadow.normalBias = 0.012;
    if (light.isPointLight) {
      light.shadow.camera.near = 0.08;
      light.shadow.camera.far = light.distance > 0 ? light.distance : 120;
    }
    if (light.isSpotLight) {
      light.shadow.camera.near = 0.08;
      light.shadow.camera.far = light.distance > 0 ? light.distance : 120;
    }
    if (light.isDirectionalLight) {
      light.shadow.camera.left = -30;
      light.shadow.camera.right = 30;
      light.shadow.camera.top = 30;
      light.shadow.camera.bottom = -30;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 100;
      light.shadow.camera.updateProjectionMatrix();
    }
  }
}

export function hasExportedLights(scene) {
  let foundLight = false;
  scene.traverse((object) => {
    if (object.isLight) foundLight = true;
  });
  return foundLight;
}

export function getModelLightAnchors(scene, group) {
  const points = [];

  scene.traverse((object) => {
    if (!object.isMesh) return;
    const materials = getMaterialList(object.material);
    const lightConfig = materials.map((material) => EMISSIVE_LIGHT_MATERIALS.get(material.name)).find(Boolean);
    if (!lightConfig) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const source = center.clone();
    source.y = box.max.y - size.y * 0.35;
    const localPosition = group.worldToLocal(source.clone());
    const tableTarget = source.clone();
    tableTarget.y = box.min.y - 0.52;
    tableTarget.z += 1.85;
    const scale = Math.max(size.x, size.y, size.z) * lightConfig.glowScale * 0.18;

    points.push({
      id: `${object.uuid}-${materials.map((material) => material.name).join("-")}`,
      position: localPosition.toArray(),
      target: group.worldToLocal(tableTarget).toArray(),
      color: lightConfig.color,
      intensity: lightConfig.intensity,
      distance: lightConfig.distance,
      glowScale: [scale, scale, scale],
    });
  });

  return { points };
}
