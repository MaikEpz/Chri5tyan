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
  animateCtaDots = false,
  cornerRadius = 0,
  contentScaleY = 1,
  glowColor = "#d7f7ff",
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
  const texture = useMonitorPageTexture(
    view,
    activeView,
    isOpen,
    isFocused,
    idleBackground,
  );
  const { gl } = useThree();

  useFrame(({ clock }) => {
    if (!screenMaterialRef.current) return;
    const time = clock.getElapsedTime();
    const brightness = 0.99 + Math.sin(time * 0.82) * 0.045 + Math.sin(time * 2.1 + 0.8) * 0.025;
    screenMaterialRef.current.color.setScalar(THREE.MathUtils.clamp(brightness, 0.92, 1.06));
  });

  useEffect(() => {
    gl.domElement.style.cursor = hoveredButton === null ? "default" : "pointer";
    return () => {
      gl.domElement.style.cursor = "default";
    };
  }, [gl.domElement, hoveredButton]);

  if (!anchor) return null;

  const [screenWidth, screenHeight] = [anchor.width, anchor.height];
  const pageWidth = screenWidth;
  const pageHeight = screenHeight;
  const buttonY = pageHeight / 2 - 0.22;
  const buttonWidth = 0.62;
  const buttonHeight = 0.2;
  const buttonStartX = 0.34;
  const buttonGap = 0.72;
  const hitDepth = 0.12 * (anchor.normalDirection ?? 1);
  const backButtonWidth = (126 / 1024) * pageWidth;
  const backButtonHeight = (48 / 390) * pageHeight;
  const backButtonPosition = [
    ((36 + 126 / 2) / 1024 - 0.5) * pageWidth,
    (0.5 - (34 + 48 / 2) / 390) * pageHeight,
    hitDepth,
  ];

  return (
    <>
      <group position={anchor.position} quaternion={anchor.quaternion} renderOrder={30}>
        <group
          position={[SCREEN_CONTENT_OFFSET_X, 0, 0]}
          scale={[1, contentScaleY, 1]}
        >
        <mesh position={[0, 0, 0.002 * (anchor.normalDirection ?? 1)]} renderOrder={30}>
          <ScreenGeometry
            cornerRadius={cornerRadius}
            height={pageHeight}
            width={pageWidth}
          />
          <meshBasicMaterial
            ref={screenMaterialRef}
            depthTest={screenDepthTest}
            depthWrite={false}
            map={texture}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {!isOpen && (
          <>
            <ScreenGlow
              color={glowColor}
              cornerRadius={cornerRadius}
              height={pageHeight}
              hovered={hoveredButton !== null}
              normalDirection={anchor.normalDirection ?? 1}
              width={pageWidth}
            />
            <MonitorVectorLogo
              color={logoColor}
              normalDirection={anchor.normalDirection ?? 1}
              screenWidth={pageWidth}
            />
            {!unlocking && idleCta && (
              <ScreenCta
                animateDots={animateCtaDots}
                color={idleTextColor}
                label={idleCta}
                normalDirection={anchor.normalDirection ?? 1}
                screenHeight={pageHeight}
                screenWidth={pageWidth}
              />
            )}
            {showNotification && !unlocking && (
              <ScreenNotification
                normalDirection={anchor.normalDirection ?? 1}
                screenHeight={pageHeight}
                screenWidth={pageWidth}
              />
            )}
            {showUnlockBar && (
              <PhoneUnlockBar
                normalDirection={anchor.normalDirection ?? 1}
                screenHeight={pageHeight}
                screenWidth={pageWidth}
                unlocking={unlocking}
              />
            )}
          </>
        )}

        {isOpen ? (
          <>
            {!isFocused && (
              <ScreenHitButton
                position={[0, 0, hitDepth]}
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
                position={[buttonStartX + index * buttonGap, buttonY, hitDepth]}
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
            position={[0, 0, hitDepth]}
            size={[
              pageWidth * idleHitAreaWidthScale,
              pageHeight * idleHitAreaHeightScale,
            ]}
            onClick={() => {
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

function ScreenGlow({
  color,
  cornerRadius,
  height,
  hovered,
  normalDirection,
  width,
}) {
  const materialRef = useRef(null);
  const geometry = useMemo(() => {
    const radius = Math.min(
      Math.max(cornerRadius, Math.min(width, height) * 0.025),
      width / 2,
      height / 2,
    );
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const corners = [
      [halfWidth - radius, halfHeight - radius, 0],
      [-halfWidth + radius, halfHeight - radius, Math.PI / 2],
      [-halfWidth + radius, -halfHeight + radius, Math.PI],
      [halfWidth - radius, -halfHeight + radius, Math.PI * 1.5],
    ];
    const points = [];

    corners.forEach(([centerX, centerY, startAngle]) => {
      for (let step = 0; step <= 12; step += 1) {
        const angle = startAngle + (step / 12) * (Math.PI / 2);
        points.push(
          new THREE.Vector3(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
            0,
          ),
        );
      }
    });

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [cornerRadius, height, width]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const phase = clock.getElapsedTime() % 4.8;
    const pulse = Math.exp(-Math.pow((phase - 0.55) / 0.42, 2));
    materialRef.current.opacity = hovered ? 0.9 : 0.16 + pulse * 0.68;
  });

  return (
    <lineLoop
      geometry={geometry}
      position={[0, 0, 0.009 * normalDirection]}
      renderOrder={33}
    >
      <lineBasicMaterial
        ref={materialRef}
        blending={THREE.AdditiveBlending}
        color={color}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        transparent
      />
    </lineLoop>
  );
}

function ScreenGeometry({ cornerRadius, height, width }) {
  const shape = useMemo(() => {
    if (cornerRadius <= 0) return null;

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const radius = Math.min(cornerRadius, halfWidth, halfHeight);
    const roundedRectangle = new THREE.Shape();
    roundedRectangle.moveTo(-halfWidth + radius, -halfHeight);
    roundedRectangle.lineTo(halfWidth - radius, -halfHeight);
    roundedRectangle.quadraticCurveTo(
      halfWidth,
      -halfHeight,
      halfWidth,
      -halfHeight + radius,
    );
    roundedRectangle.lineTo(halfWidth, halfHeight - radius);
    roundedRectangle.quadraticCurveTo(
      halfWidth,
      halfHeight,
      halfWidth - radius,
      halfHeight,
    );
    roundedRectangle.lineTo(-halfWidth + radius, halfHeight);
    roundedRectangle.quadraticCurveTo(
      -halfWidth,
      halfHeight,
      -halfWidth,
      halfHeight - radius,
    );
    roundedRectangle.lineTo(-halfWidth, -halfHeight + radius);
    roundedRectangle.quadraticCurveTo(
      -halfWidth,
      -halfHeight,
      -halfWidth + radius,
      -halfHeight,
    );
    roundedRectangle.closePath();
    return roundedRectangle;
  }, [cornerRadius, height, width]);

  return shape
    ? <shapeGeometry args={[shape]} />
    : <planeGeometry args={[width, height]} />;
}

function MonitorVectorLogo({ color, normalDirection, screenWidth }) {
  const materialRefs = useRef([]);
  const logoGroupRef = useRef(null);
  const logoScale = (screenWidth * 0.6) / 1368;
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
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
    materialRefs.current.forEach((material) => {
      material?.color.copy(baseColor).multiplyScalar(brightness);
    });
    logoGroupRef.current?.scale.setScalar(1 + Math.sin(time * 1.15) * 0.03);
  });

  return (
    <group
      ref={logoGroupRef}
      position={[0, 0, 0.004 * normalDirection]}
      renderOrder={31}
    >
      <Center precise>
        <group
          scale={[
            logoScale * normalDirection,
            -logoScale,
            logoScale,
          ]}
        >
          {geometries.map((geometry, index) => (
            <mesh key={index} geometry={geometry} renderOrder={31}>
              <meshBasicMaterial
                ref={(material) => {
                  materialRefs.current[index] = material;
                }}
                color={color}
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

function ScreenCta({
  animateDots,
  color,
  label,
  normalDirection,
  screenHeight,
  screenWidth,
}) {
  const groupRef = useRef(null);
  const materialRef = useRef(null);
  const dotCountRef = useRef(-1);
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    return { canvas, context, texture: canvasTexture };
  }, []);

  useEffect(() => {
    dotCountRef.current = -1;
    drawCta(surface, color, label);
  }, [color, label, surface]);

  useEffect(() => () => surface.texture.dispose(), [surface]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const time = clock.getElapsedTime();
    if (animateDots) {
      const dotCount = Math.floor(time * 2.4) % 4;
      if (dotCountRef.current !== dotCount) {
        dotCountRef.current = dotCount;
        drawCta(surface, color, `${label}${".".repeat(dotCount)}`);
      }
    }

    const pulse = Math.sin(time * 1.15);
    const scale = 1 + pulse * 0.045;
    materialRef.current.opacity = 0.62 + pulse * 0.2;
    groupRef.current?.scale.set(normalDirection * scale, scale, 1);
  });

  const width = screenWidth * 0.72;
  const height = width * (160 / 1024);

  return (
    <group
      ref={groupRef}
      position={[0, -screenHeight * 0.29, 0.007 * normalDirection]}
      scale={[normalDirection, 1, 1]}
      renderOrder={32}
    >
      <mesh renderOrder={32}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={materialRef}
          alphaTest={0.02}
          depthTest={false}
          depthWrite={false}
          map={surface.texture}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function drawCta(surface, color, label) {
  const { canvas, context, texture } = surface;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.font = "700 46px Inter, Arial, sans-serif";
  context.letterSpacing = "4px";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label.toUpperCase(), canvas.width / 2, canvas.height / 2);
  texture.needsUpdate = true;
}

function ScreenNotification({ normalDirection, screenHeight, screenWidth }) {
  const groupRef = useRef(null);
  const radius = screenWidth * 0.026;

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.7) * 0.16;
    groupRef.current?.scale.setScalar(pulse);
  });

  return (
    <group
      ref={groupRef}
      position={[
        screenWidth * 0.36 * normalDirection,
        screenHeight * 0.39,
        0.012 * normalDirection,
      ]}
      renderOrder={34}
    >
      <mesh renderOrder={34}>
        <circleGeometry args={[radius * 2.15, 24]} />
        <meshBasicMaterial
          color="#ff334f"
          depthTest={false}
          depthWrite={false}
          opacity={0.2}
          side={THREE.DoubleSide}
          transparent
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.001 * normalDirection]} renderOrder={35}>
        <circleGeometry args={[radius, 24]} />
        <meshBasicMaterial
          color="#ff2945"
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function PhoneUnlockBar({
  normalDirection,
  screenHeight,
  screenWidth,
  unlocking,
}) {
  const materialRef = useRef(null);
  const progressRef = useRef(0);
  const renderedProgressRef = useRef(-1);
  const barWidth = screenWidth * 0.84;
  const barHeight = barWidth * (240 / 1024);
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return { canvas, context, texture };
  }, []);

  useEffect(() => {
    drawPhoneUnlockSlider(surface, 0);
    return () => surface.texture.dispose();
  }, [surface]);

  useFrame((_, delta) => {
    if (unlocking) {
      progressRef.current = Math.min(1, progressRef.current + delta / 0.68);
    } else {
      progressRef.current = 0;
    }

    const progress = progressRef.current;
    if (renderedProgressRef.current !== progress) {
      renderedProgressRef.current = progress;
      drawPhoneUnlockSlider(surface, progress);
    }
    if (materialRef.current) {
      materialRef.current.opacity = 1 - Math.max(0, progress - 0.82) / 0.18;
    }
  });

  return (
    <group
      position={[0, -screenHeight * 0.39, 0.014 * normalDirection]}
      renderOrder={36}
      scale={[normalDirection, 1, 1]}
    >
      <mesh renderOrder={36}>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial
          ref={materialRef}
          depthTest={false}
          depthWrite={false}
          map={surface.texture}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function drawPhoneUnlockSlider(surface, progress) {
  const { canvas, context, texture } = surface;
  const easedProgress = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  const trackX = 8;
  const trackY = 18;
  const trackWidth = canvas.width - 16;
  const trackHeight = canvas.height - 36;
  const trackRadius = trackHeight / 2;
  const knobMargin = 12;
  const knobSize = trackHeight - knobMargin * 2;
  const knobStartX = trackX + knobMargin;
  const knobEndX = trackX + trackWidth - knobMargin - knobSize;
  const knobX = THREE.MathUtils.lerp(knobStartX, knobEndX, easedProgress);
  const knobY = trackY + knobMargin;

  context.clearRect(0, 0, canvas.width, canvas.height);

  const trackGradient = context.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
  trackGradient.addColorStop(0, "rgba(82,82,86,0.97)");
  trackGradient.addColorStop(0.56, "rgba(61,61,65,0.97)");
  trackGradient.addColorStop(1, "rgba(45,45,49,0.97)");
  drawRoundedRect(
    context,
    trackX,
    trackY,
    trackWidth,
    trackHeight,
    trackRadius,
    trackGradient,
  );
  context.strokeStyle = "rgba(255,255,255,0.14)";
  context.lineWidth = 3;
  strokeRoundedRect(context, trackX, trackY, trackWidth, trackHeight, trackRadius);

  const textOpacity = Math.max(0, 0.84 * (1 - progress * 1.35));
  context.fillStyle = `rgba(255,255,255,${textOpacity})`;
  context.font = "550 44px Inter, Arial, sans-serif";
  context.letterSpacing = "0px";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    "Deslizar para desbloquear",
    trackX + trackWidth * 0.61,
    trackY + trackHeight * 0.52,
  );

  context.shadowColor = "rgba(0,0,0,0.38)";
  context.shadowBlur = 22;
  context.shadowOffsetY = 8;
  drawRoundedRect(
    context,
    knobX,
    knobY,
    knobSize,
    knobSize,
    knobSize / 2,
    "#ffffff",
  );
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  texture.needsUpdate = true;
}

function useMonitorPageTexture(view, activeView, isOpen, isFocused, idleBackground) {
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
      drawLogoScreen(context, width, height, idleBackground);
      texture.needsUpdate = true;
      return;
    }

    drawMonitorPage(context, width, height, view, activeView, isFocused);
    texture.needsUpdate = true;
  }, [activeView, idleBackground, isFocused, isOpen, texture, view]);

  return texture;
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

function drawLogoScreen(context, width, height, background) {
  context.fillStyle = background;
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
