import * as THREE from "three";
import { CAMERA } from "../sceneConfig.js";

export function cloneMaterial(material) {
  if (Array.isArray(material)) return material.map((entry) => entry?.clone?.() ?? entry);
  return material.clone();
}

export function getMaterialList(material) {
  return (Array.isArray(material) ? material : [material]).filter(Boolean);
}

export function isNearlyBlackMaterial(material) {
  return material.color && material.color.r < 0.08 && material.color.g < 0.08 && material.color.b < 0.08;
}

export function getMonitorScreenAnchor(scene) {
  const monitorPanel = scene.getObjectByName("Object5");
  if (monitorPanel?.geometry) return getLegacyMonitorAnchor(monitorPanel);

  let optimizedMonitorPanel = null;
  scene.traverse((object) => {
    if (optimizedMonitorPanel || !object.isMesh) return;
    const hasMonitorMaterial = getMaterialList(object.material).some((material) => material.name === "Grau");
    if (hasMonitorMaterial) optimizedMonitorPanel = object;
  });

  return optimizedMonitorPanel ? getOptimizedMonitorAnchor(optimizedMonitorPanel) : null;
}

function getLegacyMonitorAnchor(monitorPanel) {
  const { localSize, position, quaternion, worldScale } = getPanelGeometry(monitorPanel);
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();
  const cameraDirection = CAMERA.position.clone().sub(position);
  let normalDirection = 1;

  if (normal.dot(cameraDirection) < 0) {
    normal.negate();
    normalDirection = -1;
  }

  const panelDepth = localSize.z * Math.abs(worldScale.z);
  position.add(normal.clone().multiplyScalar(panelDepth / 2));

  return {
    position: position.toArray(),
    quaternion: quaternion.toArray(),
    normal: normal.toArray(),
    normalDirection,
    width: localSize.x * Math.abs(worldScale.x),
    height: localSize.y * Math.abs(worldScale.y),
  };
}

function getOptimizedMonitorAnchor(monitorPanel) {
  const { localSize, position, quaternion: panelQuaternion, worldScale } = getPanelGeometry(monitorPanel);
  const screenRight = new THREE.Vector3(0, 0, -1).applyQuaternion(panelQuaternion).normalize();
  const screenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(panelQuaternion).normalize();
  const panelNormal = new THREE.Vector3(1, 0, 0).applyQuaternion(panelQuaternion).normalize();
  const screenRotation = new THREE.Matrix4().makeBasis(screenRight, screenUp, panelNormal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(screenRotation);
  const normal = panelNormal.clone();
  const cameraDirection = CAMERA.position.clone().sub(position);
  let normalDirection = 1;

  if (normal.dot(cameraDirection) < 0) {
    normal.negate();
    normalDirection = -1;
  }

  const panelDepth = localSize.x * Math.abs(worldScale.x);
  position.add(normal.clone().multiplyScalar(panelDepth / 2));

  return {
    position: position.toArray(),
    quaternion: quaternion.toArray(),
    normal: normal.toArray(),
    normalDirection,
    width: localSize.z * Math.abs(worldScale.z),
    height: localSize.y * Math.abs(worldScale.y),
  };
}

function getPanelGeometry(monitorPanel) {

  monitorPanel.updateWorldMatrix(true, false);
  if (!monitorPanel.geometry.boundingBox) monitorPanel.geometry.computeBoundingBox();

  const localBox = monitorPanel.geometry.boundingBox;
  const localSize = localBox.getSize(new THREE.Vector3());
  const localCenter = localBox.getCenter(new THREE.Vector3());
  const worldScale = monitorPanel.getWorldScale(new THREE.Vector3());
  const quaternion = monitorPanel.getWorldQuaternion(new THREE.Quaternion());
  const position = monitorPanel.localToWorld(localCenter.clone());

  return {
    localBox,
    localSize,
    position,
    quaternion,
    worldScale,
  };
}
