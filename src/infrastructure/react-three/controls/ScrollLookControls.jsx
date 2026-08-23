import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCROLL_LOOK, SCREEN_CONTENT_OFFSET_X } from "../sceneConfig.js";

const MONITOR_FOCUS_PADDING = 1.1578947368421053;
const MONITOR_FOCUS_DURATION = 1.5;
const MONITOR_FOCUS_ARC_HEIGHT = 0.22;
const MONITOR_OVERLAY_INSET = 0.017425;
const MONITOR_OVERLAY_OFFSET_X = 0;
const AMBIENT_YAW = THREE.MathUtils.degToRad(1.35);
const AMBIENT_PITCH = THREE.MathUtils.degToRad(0.55);
const AMBIENT_POSITION_X = 0.11;
const AMBIENT_POSITION_Y = 0.075;
const AMBIENT_POSITION_Z = 0.065;

export function ScrollLookControls({
  cameraPosition,
  cameraTarget,
  enabled,
  focusAnchor = null,
  onFocusComplete = () => {},
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
  const focusCompleteNotified = useRef(false);
  const wasFocused = useRef(false);
  const returnStartPosition = useRef(new THREE.Vector3());
  const returnStartQuaternion = useRef(new THREE.Quaternion());
  const returnTargetQuaternion = useRef(new THREE.Quaternion());
  const returnProgress = useRef(0);
  const isReturning = useRef(false);
  const lastResetKey = useRef(resetKey);
  const ambientBlend = useRef(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => {
      reduceMotion.current = motionQuery.matches;
    };

    handleMotionPreference();
    motionQuery.addEventListener("change", handleMotionPreference);
    return () => motionQuery.removeEventListener("change", handleMotionPreference);
  }, []);

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

  useLayoutEffect(() => {
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

  useFrame(({ clock }, delta) => {
    if (!enabled || !initialized.current) return;

    if (focusAnchor) {
      ambientBlend.current = 0;
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
        focusCompleteNotified.current = false;
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
      if (transitionProgress.current >= 1 && !focusCompleteNotified.current) {
        focusCompleteNotified.current = true;
        onFocusComplete(getProjectedScreenBounds(focusAnchor, camera, gl.domElement));
      }
      return;
    }

    if (isReturning.current) {
      ambientBlend.current = 0;
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
    focusCompleteNotified.current = false;

    yaw.current = THREE.MathUtils.damp(yaw.current, targetYaw.current, SCROLL_LOOK.smoothing, delta);
    pitch.current = THREE.MathUtils.damp(
      pitch.current,
      targetPitch.current,
      SCROLL_LOOK.smoothing,
      delta,
    );

    ambientBlend.current = THREE.MathUtils.damp(
      ambientBlend.current,
      reduceMotion.current ? 0 : 1,
      1.8,
      delta,
    );
    const time = clock.getElapsedTime();
    const ambientYaw = (
      Math.sin(time * 0.32)
      + Math.sin(time * 0.14 + 1.4) * 0.28
    ) * AMBIENT_YAW * ambientBlend.current;
    const ambientPitch = Math.sin(time * 0.23 + 0.8)
      * AMBIENT_PITCH
      * ambientBlend.current;

    camera.rotation.set(
      pitch.current + ambientPitch,
      yaw.current + ambientYaw,
      0,
      "YXZ",
    );
    camera.position.fromArray(cameraPosition);
    camera.position.x += Math.sin(time * 0.2 + 0.5)
      * AMBIENT_POSITION_X
      * ambientBlend.current;
    camera.position.y += Math.sin(time * 0.25 + 1.8)
      * AMBIENT_POSITION_Y
      * ambientBlend.current;
    camera.position.z += Math.sin(time * 0.16 + 2.6)
      * AMBIENT_POSITION_Z
      * ambientBlend.current;
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

function getProjectedScreenBounds(anchor, camera, canvas) {
  const center = new THREE.Vector3().fromArray(anchor.position);
  const rotation = new THREE.Quaternion().fromArray(anchor.quaternion);
  const contentOffset = new THREE.Vector3(SCREEN_CONTENT_OFFSET_X, 0, 0).applyQuaternion(rotation);
  center.add(contentOffset);

  const corners = [
    [-anchor.width / 2, anchor.height / 2, 0],
    [anchor.width / 2, anchor.height / 2, 0],
    [anchor.width / 2, -anchor.height / 2, 0],
    [-anchor.width / 2, -anchor.height / 2, 0],
  ].map(([x, y, z]) => (
    new THREE.Vector3(x, y, z)
      .applyQuaternion(rotation)
      .add(center)
      .project(camera)
  ));

  const canvasBounds = canvas.getBoundingClientRect();
  const screenPoints = corners.map((corner) => ({
    x: canvasBounds.left + ((corner.x + 1) / 2) * canvasBounds.width,
    y: canvasBounds.top + ((1 - corner.y) / 2) * canvasBounds.height,
  }));
  const left = Math.min(...screenPoints.map((point) => point.x));
  const right = Math.max(...screenPoints.map((point) => point.x));
  const top = Math.min(...screenPoints.map((point) => point.y));
  const bottom = Math.max(...screenPoints.map((point) => point.y));
  const width = right - left;
  const height = bottom - top;
  const horizontalInset = width * MONITOR_OVERLAY_INSET;
  const verticalInset = height * MONITOR_OVERLAY_INSET;

  return {
    height: height - verticalInset * 2,
    left: left + horizontalInset + width * MONITOR_OVERLAY_OFFSET_X,
    top: top + verticalInset,
    width: width - horizontalInset * 2,
  };
}
