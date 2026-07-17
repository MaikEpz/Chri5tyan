import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCROLL_LOOK, SCREEN_CONTENT_OFFSET_X } from "../sceneConfig.js";

const MONITOR_FOCUS_PADDING = 1.04;
const MONITOR_FOCUS_DURATION = 1.5;
const MONITOR_FOCUS_ARC_HEIGHT = 0.22;

export function ScrollLookControls({
  cameraPosition,
  cameraTarget,
  enabled,
  focusAnchor = null,
  resetKey = 0,
}) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const targetYaw = useRef(0);
  const initialYaw = useRef(0);
  const pitch = useRef(0);
  const targetPitch = useRef(0);
  const initialPitch = useRef(0);
  const initialized = useRef(false);
  const focusPosition = useRef(new THREE.Vector3());
  const focusTarget = useRef(new THREE.Vector3());
  const focusDirection = useRef(new THREE.Vector3());
  const focusOffset = useRef(new THREE.Vector3());
  const focusQuaternion = useRef(new THREE.Quaternion());
  const focusLookMatrix = useRef(new THREE.Matrix4());
  const focusTargetQuaternion = useRef(new THREE.Quaternion());
  const transitionStartPosition = useRef(new THREE.Vector3());
  const transitionStartQuaternion = useRef(new THREE.Quaternion());
  const transitionProgress = useRef(0);
  const wasFocused = useRef(false);
  const returnStartPosition = useRef(new THREE.Vector3());
  const returnStartQuaternion = useRef(new THREE.Quaternion());
  const returnTargetQuaternion = useRef(new THREE.Quaternion());
  const returnProgress = useRef(0);
  const isReturning = useRef(false);
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    if (!enabled) return;

    camera.position.fromArray(cameraPosition);
    camera.lookAt(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    camera.updateProjectionMatrix();

    const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    yaw.current = rotation.y;
    targetYaw.current = rotation.y;
    initialYaw.current = rotation.y;
    pitch.current = rotation.x;
    targetPitch.current = rotation.x;
    initialPitch.current = rotation.x;
    initialized.current = true;
  }, [camera, cameraPosition, cameraTarget, enabled]);

  useEffect(() => {
    if (resetKey === lastResetKey.current) return;
    lastResetKey.current = resetKey;
    if (!enabled || !initialized.current) return;

    returnStartPosition.current.copy(camera.position);
    returnStartQuaternion.current.copy(camera.quaternion);
    focusLookMatrix.current.lookAt(
      new THREE.Vector3().fromArray(cameraPosition),
      new THREE.Vector3().fromArray(cameraTarget),
      camera.up,
    );
    returnTargetQuaternion.current.setFromRotationMatrix(focusLookMatrix.current);
    returnProgress.current = 0;
    isReturning.current = true;
    wasFocused.current = false;
    targetYaw.current = initialYaw.current;
    targetPitch.current = initialPitch.current;
  }, [camera, cameraPosition, cameraTarget, enabled, resetKey]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement;

    const applyPointerPosition = (clientX, clientY) => {
      const bounds = canvas.getBoundingClientRect();
      const horizontalProgress = THREE.MathUtils.clamp(
        (clientX - bounds.left) / bounds.width,
        0,
        1,
      );
      const verticalProgress = THREE.MathUtils.clamp(
        (clientY - bounds.top) / bounds.height,
        0,
        1,
      );

      targetYaw.current = getYawFromProgress(horizontalProgress, initialYaw.current);
      targetPitch.current = THREE.MathUtils.lerp(
        initialPitch.current + SCROLL_LOOK.maxUpPitchOffset,
        initialPitch.current - SCROLL_LOOK.maxDownPitchOffset,
        verticalProgress,
      );
    };

    const handlePointerMove = (event) => {
      applyPointerPosition(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      targetYaw.current = initialYaw.current;
      targetPitch.current = initialPitch.current;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
    };
  }, [enabled, gl.domElement]);

  useFrame((_, delta) => {
    if (!enabled || !initialized.current) return;

    if (focusAnchor) {
      isReturning.current = false;
      focusTarget.current.fromArray(focusAnchor.position);
      focusQuaternion.current.fromArray(focusAnchor.quaternion);
      focusOffset.current.set(SCREEN_CONTENT_OFFSET_X, 0, 0).applyQuaternion(focusQuaternion.current);
      focusTarget.current.add(focusOffset.current);

      if (focusAnchor.normal) {
        focusDirection.current.fromArray(focusAnchor.normal);
      } else {
        focusDirection.current.fromArray(cameraPosition).sub(focusTarget.current);
      }
      if (focusDirection.current.lengthSq() === 0) focusDirection.current.set(0, 0, 1);
      focusDirection.current.normalize();

      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const screenWidth = focusAnchor.width;
      const screenHeight = focusAnchor.height;
      const fitDistance =
        Math.max(
          screenHeight / (2 * Math.tan(verticalFov / 2)),
          screenWidth / (2 * Math.tan(horizontalFov / 2)),
        ) * MONITOR_FOCUS_PADDING;

      focusPosition.current
        .copy(focusTarget.current)
        .addScaledVector(focusDirection.current, fitDistance);

      if (!wasFocused.current) {
        wasFocused.current = true;
        transitionProgress.current = 0;
        transitionStartPosition.current.copy(camera.position);
        transitionStartQuaternion.current.copy(camera.quaternion);
      }

      transitionProgress.current = Math.min(
        transitionProgress.current + delta / MONITOR_FOCUS_DURATION,
        1,
      );
      const easedProgress = easeInOutCubic(transitionProgress.current);

      camera.position.lerpVectors(
        transitionStartPosition.current,
        focusPosition.current,
        easedProgress,
      );
      camera.position.y += Math.sin(Math.PI * easedProgress) * MONITOR_FOCUS_ARC_HEIGHT;

      focusLookMatrix.current.lookAt(focusPosition.current, focusTarget.current, camera.up);
      focusTargetQuaternion.current.setFromRotationMatrix(focusLookMatrix.current);
      camera.quaternion.slerpQuaternions(
        transitionStartQuaternion.current,
        focusTargetQuaternion.current,
        easedProgress,
      );
      return;
    }

    if (isReturning.current) {
      returnProgress.current = Math.min(
        returnProgress.current + delta / MONITOR_FOCUS_DURATION,
        1,
      );
      const easedProgress = easeInOutCubic(returnProgress.current);

      camera.position.lerpVectors(
        returnStartPosition.current,
        new THREE.Vector3().fromArray(cameraPosition),
        easedProgress,
      );
      camera.position.y += Math.sin(Math.PI * easedProgress) * MONITOR_FOCUS_ARC_HEIGHT;
      camera.quaternion.slerpQuaternions(
        returnStartQuaternion.current,
        returnTargetQuaternion.current,
        easedProgress,
      );

      if (returnProgress.current >= 1) {
        isReturning.current = false;
        yaw.current = initialYaw.current;
        pitch.current = new THREE.Euler().setFromQuaternion(
          returnTargetQuaternion.current,
          "YXZ",
        ).x;
      }
      return;
    }

    wasFocused.current = false;

    yaw.current = THREE.MathUtils.damp(yaw.current, targetYaw.current, SCROLL_LOOK.smoothing, delta);
    pitch.current = THREE.MathUtils.damp(
      pitch.current,
      targetPitch.current,
      SCROLL_LOOK.smoothing,
      delta,
    );

    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    camera.position.fromArray(cameraPosition);
    camera.position.y = cameraPosition[1];
  });

  return null;
}

function getYawFromProgress(progress, initialYaw) {
  const leftYaw = initialYaw + SCROLL_LOOK.maxLeftYawOffset;
  const rightYaw = initialYaw - SCROLL_LOOK.maxRightYawOffset;
  return THREE.MathUtils.lerp(leftYaw, rightYaw, THREE.MathUtils.clamp(progress, 0, 1));
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
