import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, MathUtils } from "three";
import { SCREEN_CONTENT_OFFSET_X, SCREEN_VIEWS } from "../sceneConfig.js";
import { MonitorVectorLogo } from "./MonitorVectorLogo.jsx";
import { ScreenGeometry } from "./ScreenGeometry.jsx";
import { PhoneUnlockBar, ScreenCta, ScreenGlow, ScreenGuide, ScreenHitButton, ScreenNotification } from "./ScreenOverlays.jsx";
import { useMonitorPageTexture } from "./useMonitorPageTexture.js";

export function MonitorScreen({
  activeView = 0,
  anchor,
  animateCtaDots = false,
  cornerRadius = 0,
  contentScaleY = 1,
  glowColor = "#d7f7ff",
  guideLabel = "",
  guideOffsetXScale = 0,
  guidePrimary = false,
  guideVisible = false,
  idleBackground = "#000000",
  idleCta = "Haz clic para explorar",
  idleHitAreaHeightScale = 1,
  idleHitAreaWidthScale = 1,
  idleTextColor = "#ffffff",
  isOpen = false,
  isFocused = false,
  logoColor = "#ffffff",
  showNotification = false,
  showUnlockBar = false,
  screenDepthTest = true,
  unlocking = false,
  onActiveViewChange = () => {},
  onClose = () => {},
  onFocusMonitor = () => {},
  onLogoOpen = () => {},
}) {
  const [hoveredButton, setHoveredButton] = useState(null);
  const screenMaterialRef = useRef(null);
  const view = SCREEN_VIEWS[activeView];
  const texture = useMonitorPageTexture(view, activeView, isOpen, isFocused, idleBackground);
  const { gl } = useThree();

  useFrame(({ clock }) => {
    if (!screenMaterialRef.current) return;
    const time = clock.getElapsedTime();
    const brightness = 0.99 + Math.sin(time * 0.82) * 0.045 + Math.sin(time * 2.1 + 0.8) * 0.025;
    screenMaterialRef.current.color.setScalar(MathUtils.clamp(brightness, 0.92, 1.06));
  });

  useEffect(() => {
    gl.domElement.style.cursor = hoveredButton === null ? "default" : "pointer";
    return () => { gl.domElement.style.cursor = "default"; };
  }, [gl.domElement, hoveredButton]);

  if (!anchor) return null;
  const pageWidth = anchor.width;
  const pageHeight = anchor.height;
  const buttonY = pageHeight / 2 - 0.22;
  const hitDepth = 0.12 * (anchor.normalDirection ?? 1);
  const backButtonPosition = [((36 + 126 / 2) / 1024 - 0.5) * pageWidth, (0.5 - (34 + 48 / 2) / 390) * pageHeight, hitDepth];

  return (
    <group position={anchor.position} quaternion={anchor.quaternion} renderOrder={30}>
      <group position={[SCREEN_CONTENT_OFFSET_X, 0, 0]} scale={[1, contentScaleY, 1]}>
        <mesh position={[0, 0, 0.002 * (anchor.normalDirection ?? 1)]} renderOrder={30}>
          <ScreenGeometry cornerRadius={cornerRadius} height={pageHeight} width={pageWidth} />
          <meshBasicMaterial ref={screenMaterialRef} depthTest={screenDepthTest} depthWrite={false} map={texture} side={DoubleSide} toneMapped={false} />
        </mesh>

        {!isOpen && (
          <>
            <ScreenGlow color={glowColor} cornerRadius={cornerRadius} height={pageHeight} hovered={hoveredButton !== null} normalDirection={anchor.normalDirection ?? 1} width={pageWidth} />
            {guideVisible && <ScreenGuide label={guideLabel} normalDirection={anchor.normalDirection ?? 1} offsetX={pageWidth * guideOffsetXScale} primary={guidePrimary} screenHeight={pageHeight} onActivate={onLogoOpen} />}
            <MonitorVectorLogo color={logoColor} normalDirection={anchor.normalDirection ?? 1} screenWidth={pageWidth} />
            {!unlocking && idleCta && <ScreenCta animateDots={animateCtaDots} color={idleTextColor} disappearing={isFocused} label={idleCta} normalDirection={anchor.normalDirection ?? 1} screenHeight={pageHeight} screenWidth={pageWidth} />}
            {showNotification && !unlocking && <ScreenNotification normalDirection={anchor.normalDirection ?? 1} screenHeight={pageHeight} screenWidth={pageWidth} />}
            {showUnlockBar && <PhoneUnlockBar normalDirection={anchor.normalDirection ?? 1} screenHeight={pageHeight} screenWidth={pageWidth} unlocking={unlocking} />}
          </>
        )}

        {isOpen ? (
          <>
            {!isFocused && <ScreenHitButton position={[0, 0, hitDepth]} size={[pageWidth, pageHeight]} onClick={onFocusMonitor} onPointerOut={() => setHoveredButton(null)} onPointerOver={() => setHoveredButton("screen")} renderOrder={40} />}
            <ScreenHitButton position={backButtonPosition} size={[(126 / 1024) * pageWidth, (48 / 390) * pageHeight]} onClick={() => { if (!isFocused) onFocusMonitor(); else onClose(); }} onPointerOut={() => setHoveredButton(null)} onPointerOver={() => setHoveredButton("view-toggle")} />
            {SCREEN_VIEWS.map((screenView, index) => <ScreenHitButton key={screenView.id} position={[0.34 + index * 0.72, buttonY, hitDepth]} size={[0.62, 0.2]} onClick={() => { onActiveViewChange(index); if (!isFocused) onFocusMonitor(); }} onPointerOut={() => setHoveredButton(null)} onPointerOver={() => setHoveredButton(screenView.id)} />)}
          </>
        ) : (
          <ScreenHitButton position={[0, 0, hitDepth]} size={[pageWidth * idleHitAreaWidthScale, pageHeight * idleHitAreaHeightScale]} onClick={onLogoOpen} onPointerOut={() => setHoveredButton(null)} onPointerOver={() => setHoveredButton("logo")} />
        )}
      </group>
    </group>
  );
}
