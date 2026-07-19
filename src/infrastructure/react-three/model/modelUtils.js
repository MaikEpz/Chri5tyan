import * as THREE from "three";
import { CAMERA } from "../sceneConfig.js";

const OPTIMIZED_SCREEN_RIGHT = new THREE.Vector3(
  0.02103884234620266,
  -0.00039778650089098094,
  -0.999778579925891,
);
const OPTIMIZED_SCREEN_UP = new THREE.Vector3(
  0.017808371750151528,
  0.999841418107791,
  -0.000023061002385509428,
);

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
  monitorPanel.updateWorldMatrix(true, false);
  const positionAttribute = monitorPanel.geometry.getAttribute("position");
  const panelQuaternion = monitorPanel.getWorldQuaternion(new THREE.Quaternion());
  const screenRight = OPTIMIZED_SCREEN_RIGHT.clone().applyQuaternion(panelQuaternion).normalize();
  const screenUp = OPTIMIZED_SCREEN_UP.clone().applyQuaternion(panelQuaternion).normalize();
  const panelNormal = new THREE.Vector3().crossVectors(screenRight, screenUp).normalize();
  const screenRotation = new THREE.Matrix4().makeBasis(screenRight, screenUp, panelNormal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(screenRotation);
  const normal = panelNormal.clone();
  const worldVertex = new THREE.Vector3();
  let minRight = Infinity;
  let maxRight = -Infinity;
  let minUp = Infinity;
  let maxUp = -Infinity;
  let minDepth = Infinity;
  let maxDepth = -Infinity;

  for (let index = 0; index < positionAttribute.count; index += 1) {
    worldVertex.fromBufferAttribute(positionAttribute, index);
    monitorPanel.localToWorld(worldVertex);
    const right = worldVertex.dot(screenRight);
    const up = worldVertex.dot(screenUp);
    const depth = worldVertex.dot(panelNormal);
    minRight = Math.min(minRight, right);
    maxRight = Math.max(maxRight, right);
    minUp = Math.min(minUp, up);
    maxUp = Math.max(maxUp, up);
    minDepth = Math.min(minDepth, depth);
    maxDepth = Math.max(maxDepth, depth);
  }

  const position = new THREE.Vector3()
    .addScaledVector(screenRight, (minRight + maxRight) / 2)
    .addScaledVector(screenUp, (minUp + maxUp) / 2)
    .addScaledVector(panelNormal, (minDepth + maxDepth) / 2);
  const cameraDirection = CAMERA.position.clone().sub(position);
  let normalDirection = 1;

  if (normal.dot(cameraDirection) < 0) {
    normal.negate();
    normalDirection = -1;
  }

  const panelDepth = maxDepth - minDepth;
  position.add(normal.clone().multiplyScalar(panelDepth / 2));

  return {
    position: position.toArray(),
    quaternion: quaternion.toArray(),
    normal: normal.toArray(),
    normalDirection,
    width: maxRight - minRight,
    height: maxUp - minUp,
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
