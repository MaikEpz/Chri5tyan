import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three-stdlib";
import chrisLogoWhiteUrl from "../../../assets/branding/chris-logo.svg";
import { SCREEN_CONTENT_OFFSET_X, SCREEN_VIEWS } from "../sceneConfig.js";

const SCREEN_TEXTURE_WIDTH = 1024;
const SCREEN_TEXTURE_HEIGHT = 390;
const SCREEN_TEXTURE_PIXEL_RATIO = 2;

export function MonitorScreen({
  activeView = 0,
  anchor,
  isOpen = false,
  isFocused = false,
  onActiveViewChange = () => {},
  onClose = () => {},
  onFocusMonitor = () => {},
  onLogoOpen = () => {},
  onScreenSnapshot = () => {},
}) {
  const [hoveredButton, setHoveredButton] = useState(null);
  const screenMaterialRef = useRef(null);
  const snapshotCapturedRef = useRef(null);
  const view = SCREEN_VIEWS[activeView];
  const texture = useMonitorPageTexture(view, activeView, isOpen, isFocused);
  const { gl } = useThree();

  useFrame(({ clock }) => {
    if (!screenMaterialRef.current) return;
    const time = clock.getElapsedTime();
    const brightness = 0.99 + Math.sin(time * 0.82) * 0.045 + Math.sin(time * 2.1 + 0.8) * 0.025;
    screenMaterialRef.current.color.setScalar(THREE.MathUtils.clamp(brightness, 0.92, 1.06));
  });

  useEffect(() => {
    gl.domElement.style.cursor = hoveredButton === null ? "crosshair" : "pointer";
    return () => {
      gl.domElement.style.cursor = "crosshair";
    };
  }, [gl.domElement, hoveredButton]);

  useEffect(() => {
    if (!isOpen) {
      snapshotCapturedRef.current = null;
      return;
    }
    if (!isFocused || snapshotCapturedRef.current === activeView) return;

    snapshotCapturedRef.current = activeView;
    onScreenSnapshot(texture.image.toDataURL("image/png"));
  }, [activeView, isFocused, isOpen, onScreenSnapshot, texture]);

  if (!anchor) return null;

  const [screenWidth, screenHeight] = [anchor.width, anchor.height];
  const pageWidth = screenWidth;
  const pageHeight = screenHeight;
  const buttonY = pageHeight / 2 - 0.22;
  const buttonWidth = 0.62;
  const buttonHeight = 0.2;
  const buttonStartX = 0.34;
  const buttonGap = 0.72;
  const logoHitWidth = pageWidth * 0.92;
  const logoHitHeight = pageHeight * 0.86;
  const backButtonWidth = (126 / 1024) * pageWidth;
  const backButtonHeight = (48 / 390) * pageHeight;
  const backButtonPosition = [
    ((36 + 126 / 2) / 1024 - 0.5) * pageWidth,
    (0.5 - (34 + 48 / 2) / 390) * pageHeight,
    0.12,
  ];

  return (
    <>
      <group position={anchor.position} quaternion={anchor.quaternion} renderOrder={30}>
        <group position={[SCREEN_CONTENT_OFFSET_X, 0, 0]}>
        <mesh position={[0, 0, 0.002 * (anchor.normalDirection ?? 1)]} renderOrder={30}>
          <planeGeometry args={[pageWidth, pageHeight]} />
          <meshBasicMaterial
            ref={screenMaterialRef}
            depthWrite={false}
            map={texture}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {!isOpen && (
          <MonitorVectorLogo
            normalDirection={anchor.normalDirection ?? 1}
            screenWidth={pageWidth}
          />
        )}

        {isOpen ? (
          <>
            {!isFocused && (
              <ScreenHitButton
                position={[0, 0, 0.1]}
                size={[pageWidth, pageHeight]}
                onClick={onFocusMonitor}
                onPointerOut={() => setHoveredButton(null)}
                onPointerOver={() => setHoveredButton("screen")}
                renderOrder={40}
              />
            )}
            <ScreenHitButton
              position={backButtonPosition}
              size={[backButtonWidth, backButtonHeight]}
              onClick={() => {
                if (!isFocused) {
                  onFocusMonitor();
                  return;
                }
                onClose();
              }}
              onPointerOut={() => setHoveredButton(null)}
              onPointerOver={() => setHoveredButton("view-toggle")}
            />
            {SCREEN_VIEWS.map((screenView, index) => (
              <ScreenHitButton
                key={screenView.id}
                position={[buttonStartX + index * buttonGap, buttonY, 0.12]}
                size={[buttonWidth, buttonHeight]}
                onClick={() => {
                  onActiveViewChange(index);
                  if (!isFocused) onFocusMonitor();
                }}
                onPointerOut={() => setHoveredButton(null)}
                onPointerOver={() => setHoveredButton(screenView.id)}
              />
            ))}
          </>
        ) : (
          <ScreenHitButton
            position={[0, 0, 0.12]}
            size={[logoHitWidth, logoHitHeight]}
            onClick={() => {
              onScreenSnapshot(createMonitorPageSnapshot(view, activeView, true));
              onLogoOpen();
            }}
            onPointerOut={() => setHoveredButton(null)}
            onPointerOver={() => setHoveredButton("logo")}
          />
        )}
        </group>
      </group>
    </>
  );
}

function MonitorVectorLogo({ normalDirection, screenWidth }) {
  const materialRefs = useRef([]);
  const logoScale = (screenWidth * 0.6) / 1368;
  const svg = useLoader(SVGLoader, chrisLogoWhiteUrl);
  const geometries = useMemo(
    () => svg.paths.flatMap((path) => SVGLoader.createShapes(path).map((shape) => new THREE.ShapeGeometry(shape, 64))),
    [svg],
  );

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
    },
    [geometries],
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const brightness = THREE.MathUtils.clamp(
      0.95 + Math.sin(time * 0.82) * 0.032 + Math.sin(time * 2.1 + 0.8) * 0.018,
      0.9,
      1,
    );
    materialRefs.current.forEach((material) => material?.color.setScalar(brightness));
  });

  return (
    <group position={[0, 0, 0.004 * normalDirection]} renderOrder={31}>
      <Center precise>
        <group scale={[logoScale, -logoScale, logoScale]}>
          {geometries.map((geometry, index) => (
            <mesh key={index} geometry={geometry} renderOrder={31}>
              <meshBasicMaterial
                ref={(material) => {
                  materialRefs.current[index] = material;
                }}
                color="#ffffff"
                depthTest={false}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      </Center>
    </group>
  );
}

function useMonitorPageTexture(view, activeView, isOpen, isFocused) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_TEXTURE_WIDTH * SCREEN_TEXTURE_PIXEL_RATIO;
    canvas.height = SCREEN_TEXTURE_HEIGHT * SCREEN_TEXTURE_PIXEL_RATIO;
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.anisotropy = 8;
    canvasTexture.generateMipmaps = true;
    return canvasTexture;
  }, []);

  useEffect(() => {
    const canvas = texture.image;
    const context = canvas.getContext("2d");
    const width = SCREEN_TEXTURE_WIDTH;
    const height = SCREEN_TEXTURE_HEIGHT;

    context.setTransform(SCREEN_TEXTURE_PIXEL_RATIO, 0, 0, SCREEN_TEXTURE_PIXEL_RATIO, 0, 0);
    context.clearRect(0, 0, width, height);
    if (!isOpen) {
      drawLogoScreen(context, width, height);
      texture.needsUpdate = true;
      return;
    }

    drawMonitorPage(context, width, height, view, activeView, isFocused);
    texture.needsUpdate = true;
  }, [activeView, isFocused, isOpen, texture, view]);

  return texture;
}

function createMonitorPageSnapshot(view, activeView, isFocused) {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_TEXTURE_WIDTH * SCREEN_TEXTURE_PIXEL_RATIO;
  canvas.height = SCREEN_TEXTURE_HEIGHT * SCREEN_TEXTURE_PIXEL_RATIO;
  const context = canvas.getContext("2d");
  context.setTransform(SCREEN_TEXTURE_PIXEL_RATIO, 0, 0, SCREEN_TEXTURE_PIXEL_RATIO, 0, 0);
  drawMonitorPage(
    context,
    SCREEN_TEXTURE_WIDTH,
    SCREEN_TEXTURE_HEIGHT,
    view,
    activeView,
    isFocused,
  );
  return canvas.toDataURL("image/png");
}

function drawMonitorPage(context, width, height, view, activeView, isFocused) {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);

  drawRoundedRect(context, 36, 34, 126, 48, 12, "rgba(255,255,255,0.07)");
  context.strokeStyle = "rgba(255,255,255,0.2)";
  context.lineWidth = 2;
  strokeRoundedRect(context, 36, 34, 126, 48, 12);
  context.fillStyle = "#ffffff";
  context.font = "800 22px Inter, Arial, sans-serif";
  context.fillText(isFocused ? "Volver" : "Abrir", isFocused ? 58 : 64, 65);

  context.fillStyle = "#ffffff";
  context.font = "800 34px Inter, Arial, sans-serif";
  context.fillText("Chris", 190, 66);

  SCREEN_VIEWS.forEach((screenView, index) => {
    const x = 520 + index * 150;
    const y = 34;
    const active = index === activeView;
    drawRoundedRect(
      context,
      x,
      y,
      126,
      48,
      12,
      active ? screenView.accent : "rgba(255,255,255,0.07)",
    );
    context.strokeStyle = active ? screenView.accent : "rgba(255,255,255,0.2)";
    context.lineWidth = 2;
    strokeRoundedRect(context, x, y, 126, 48, 12);
    context.fillStyle = active ? "#050505" : "#ffffff";
    context.font = "800 22px Inter, Arial, sans-serif";
    context.fillText(screenView.label, x + 20, y + 31);
  });

  context.fillStyle = view.accent;
  context.font = "900 20px Inter, Arial, sans-serif";
  context.fillText(view.eyebrow.toUpperCase(), 42, 134);

  context.fillStyle = "#ffffff";
  context.font = "900 58px Inter, Arial, sans-serif";
  context.fillText(view.title, 42, 198);

  context.fillStyle = "#bcbcbc";
  context.font = "500 26px Inter, Arial, sans-serif";
  context.fillText(view.copy, 44, 246);

  drawRoundedRect(context, 762, 128, 210, 150, 18, "rgba(255,255,255,0.07)");
  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.lineWidth = 2;
  strokeRoundedRect(context, 762, 128, 210, 150, 18);
  context.fillStyle = view.accent;
  context.font = "900 58px Inter, Arial, sans-serif";
  context.fillText(view.stat, 792, 218);
  context.fillStyle = "#ffffff";
  context.font = "800 22px Inter, Arial, sans-serif";
  context.fillText(view.label, 794, 252);

  drawRoundedRect(context, 42, 318, 150, 16, 8, view.accent);
  drawRoundedRect(context, 216, 318, 432, 16, 8, "rgba(255,255,255,0.26)");
  drawRoundedRect(context, 680, 318, 250, 16, 8, "rgba(255,255,255,0.26)");
}

function drawLogoScreen(context, width, height) {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);

}

function ScreenHitButton({ onClick, onPointerOut, onPointerOver, position, renderOrder = 45, size }) {
  return (
    <mesh
      position={position}
      renderOrder={renderOrder}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onPointerOut();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onPointerOver();
      }}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial depthTest={false} opacity={0} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle) {
  context.fillStyle = fillStyle;
  roundedRectPath(context, x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(context, x, y, width, height, radius) {
  roundedRectPath(context, x, y, width, height, radius);
  context.stroke();
}

function roundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
