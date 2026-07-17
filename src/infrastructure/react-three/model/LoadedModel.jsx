import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { EMISSIVE_LIGHT_MATERIALS } from "../sceneConfig.js";
import { ModelLightRig } from "../lights/LightRigs.jsx";
import { configureExportedLight, getModelLightAnchors, hasExportedLights } from "../lights/lightUtils.js";
import { cloneMaterial, getMaterialList, getMonitorScreenAnchor, isNearlyBlackMaterial } from "./modelUtils.js";

const DESK_EMISSIVE = new Map([
  ["Mesh_0.001", { color: "#302820", intensity: 0.026 }],
  ["Mesh_0.002", { color: "#171512", intensity: 0.016 }],
]);

const LIGHT_PERMEABLE_MESHES = new Set(["Object_25"]);

const ktx2Loaders = new WeakMap();

function getKtx2Loader(renderer, lowPowerMode) {
  if (!ktx2Loaders.has(renderer)) {
    const loader = new KTX2Loader()
      .setTranscoderPath(`${import.meta.env.BASE_URL}basis/`)
      .setWorkerLimit(lowPowerMode ? 1 : 2)
      .detectSupport(renderer);
    ktx2Loaders.set(renderer, loader);
  }

  return ktx2Loaders.get(renderer);
}

export function LoadedModel({
  lowPowerMode = false,
  source,
  onReady,
  onScreenAnchor,
  onExportedLightsChange,
}) {
  const groupRef = useRef(null);
  const renderer = useThree((state) => state.gl);
  const ktx2Loader = useMemo(
    () => getKtx2Loader(renderer, lowPowerMode),
    [lowPowerMode, renderer],
  );
  const configureLoader = useCallback(
    (loader) => loader.setKTX2Loader(ktx2Loader),
    [ktx2Loader],
  );
  const gltf = useGLTF(source, false, true, configureLoader);
  const [modelLights, setModelLights] = useState({ points: [] });
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.set(-center.x, -box.min.y, -center.z);
    group.updateMatrixWorld(true);
    const containsExportedLights = hasExportedLights(scene);
    setModelLights(containsExportedLights ? { points: [] } : getModelLightAnchors(scene, group));
    onExportedLightsChange(containsExportedLights);
    onScreenAnchor(getMonitorScreenAnchor(scene));
    onReady();
  }, [onExportedLightsChange, onReady, onScreenAnchor, scene]);

  useEffect(() => {
    scene.traverse((object) => {
      if (object.isLight) {
        configureExportedLight(object);
        if (lowPowerMode) object.castShadow = false;
        return;
      }

      if (!object.isMesh) return;
      const isLightPermeable = LIGHT_PERMEABLE_MESHES.has(object.name);
      object.castShadow = !lowPowerMode && !isLightPermeable;
      object.receiveShadow = !lowPowerMode;
      if (object.name === "Object5") {
        object.material = new THREE.MeshBasicMaterial({
          color: "#10282f",
          side: THREE.DoubleSide,
        });
        object.renderOrder = 8;
        return;
      }
      if (object.material) {
        object.material = cloneMaterial(object.material);
        const deskEmissive = DESK_EMISSIVE.get(object.name);
        getMaterialList(object.material).forEach((material) => {
          material.side = THREE.DoubleSide;
          if (deskEmissive && material.emissive) {
            material.emissive.set(deskEmissive.color);
            material.emissiveIntensity = deskEmissive.intensity;
          }
          const lightConfig = EMISSIVE_LIGHT_MATERIALS.get(material.name);
          if (lightConfig) {
            object.castShadow = !lowPowerMode;
            material.emissive = new THREE.Color(lightConfig.color);
            material.emissiveIntensity = material.name === "m_lamp" ? 5.2 : 2.6;
            material.toneMapped = false;
          }
          if (isNearlyBlackMaterial(material)) {
            material.color.setRGB(
              Math.max(material.color.r, 0.035),
              Math.max(material.color.g, 0.04),
              Math.max(material.color.b, 0.045),
            );
            material.roughness = Math.min(material.roughness ?? 0.5, 0.42);
          }
          if (!isLightPermeable && !deskEmissive && !lightConfig && material.emissive) {
            if (material.map) {
              material.emissive.set("#ffffff");
              material.emissiveMap = material.map;
              material.emissiveIntensity = 0.016;
            } else {
              material.emissive.copy(material.color).lerp(new THREE.Color("#ffffff"), 0.06);
              material.emissiveIntensity = 0.023;
            }
          }
          material.needsUpdate = true;
        });
      }
    });
  }, [lowPowerMode, scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      <ModelLightRig lights={modelLights} />
    </group>
  );
}
