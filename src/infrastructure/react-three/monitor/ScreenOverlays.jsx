import { useEffect, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, CanvasTexture, DoubleSide, LinearFilter, MathUtils, SRGBColorSpace, Vector3 } from "three";
import { drawCta, drawPhoneUnlockSlider } from "./monitorCanvas.js";

export function ScreenGuide({ label, normalDirection, offsetX, primary, screenHeight, onActivate }) {
  return <Html center position={[offsetX, screenHeight * (primary ? 0.82 : 0.76), 0.02 * normalDirection]} zIndexRange={[60, 20]}><button className="screen-guide-callout" data-primary={primary || undefined} type="button" onClick={(event) => { event.stopPropagation(); onActivate(); }}><strong key={label}>{label}</strong></button></Html>;
}

export function ScreenGlow({ color, cornerRadius, height, hovered, normalDirection, width }) {
  const materialRefs = useRef([]);
  const geometry = useMemo(() => {
    const radius = Math.min(Math.max(cornerRadius, Math.min(width, height) * 0.025), width / 2, height / 2);
    const corners = [[width / 2 - radius, height / 2 - radius, 0], [-width / 2 + radius, height / 2 - radius, Math.PI / 2], [-width / 2 + radius, -height / 2 + radius, Math.PI], [width / 2 - radius, -height / 2 + radius, Math.PI * 1.5]];
    const points = [];
    corners.forEach(([centerX, centerY, startAngle]) => {
      for (let step = 0; step <= 12; step += 1) {
        const angle = startAngle + (step / 12) * (Math.PI / 2);
        points.push(new Vector3(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, 0));
      }
    });
    return new BufferGeometry().setFromPoints(points);
  }, [cornerRadius, height, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    const phase = clock.getElapsedTime() % 2;
    const pulse = phase < 0.9 ? Math.sin((phase / 0.9) * Math.PI) ** 2 : 0;
    materialRefs.current.forEach((material, index) => { if (material) material.opacity = index === 4 ? (hovered ? 0.68 : 0.1 + pulse * 0.38) : pulse * 0.34; });
  });
  const offset = Math.min(width, height) * 0.003;
  return <group position={[0, 0, 0.009 * normalDirection]} renderOrder={33}>{[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((layer, index) => <lineLoop key={layer} geometry={geometry} scale={[1 + (layer * offset) / width, 1 + (layer * offset) / height, 1]} renderOrder={33}><lineBasicMaterial ref={(material) => { materialRefs.current[index] = material; }} blending={AdditiveBlending} color={color} depthTest={false} depthWrite={false} toneMapped={false} transparent /></lineLoop>)}</group>;
}

export function ScreenCta({ animateDots, color, disappearing, label, normalDirection, screenHeight, screenWidth }) {
  const groupRef = useRef(null);
  const materialRef = useRef(null);
  const dotCountRef = useRef(-1);
  const progressRef = useRef(0);
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    return { canvas, context: canvas.getContext("2d"), texture };
  }, []);
  useEffect(() => { dotCountRef.current = -1; drawCta(surface, color, label); }, [color, label, surface]);
  useEffect(() => () => surface.texture.dispose(), [surface]);
  useFrame(({ clock }, delta) => {
    if (!materialRef.current) return;
    const time = clock.getElapsedTime();
    if (animateDots) {
      const dotCount = Math.floor(time * 2.4) % 4;
      if (dotCountRef.current !== dotCount) { dotCountRef.current = dotCount; drawCta(surface, color, `${label}${".".repeat(dotCount)}`); }
    }
    const scale = 1 + Math.sin(time * 1.15) * 0.045;
    progressRef.current = MathUtils.clamp(progressRef.current + (disappearing ? delta / 0.48 : -delta / 0.24), 0, 1);
    const eased = progressRef.current ** 2 * (3 - 2 * progressRef.current);
    materialRef.current.opacity = 0.3 * (1 - eased);
    groupRef.current?.scale.set(normalDirection * scale, scale, 1);
  });
  const width = screenWidth * 0.72;
  return <group ref={groupRef} position={[0, -screenHeight * 0.29, 0.007 * normalDirection]} scale={[normalDirection, 1, 1]} renderOrder={32}><mesh renderOrder={32}><planeGeometry args={[width, width * (160 / 1024)]} /><meshBasicMaterial ref={materialRef} alphaTest={0.02} depthTest={false} depthWrite={false} map={surface.texture} side={DoubleSide} toneMapped={false} transparent /></mesh></group>;
}

export function ScreenNotification({ normalDirection, screenHeight, screenWidth }) {
  const groupRef = useRef(null);
  const radius = screenWidth * 0.026;
  useFrame(({ clock }) => groupRef.current?.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2.7) * 0.16));
  return <group ref={groupRef} position={[screenWidth * 0.36 * normalDirection, screenHeight * 0.39, 0.012 * normalDirection]} renderOrder={34}><mesh renderOrder={34}><circleGeometry args={[radius * 2.15, 24]} /><meshBasicMaterial color="#ff334f" depthTest={false} depthWrite={false} opacity={0.2} side={DoubleSide} transparent toneMapped={false} /></mesh><mesh position={[0, 0, 0.001 * normalDirection]} renderOrder={35}><circleGeometry args={[radius, 24]} /><meshBasicMaterial color="#ff2945" depthTest={false} depthWrite={false} side={DoubleSide} toneMapped={false} /></mesh></group>;
}

export function PhoneUnlockBar({ normalDirection, screenHeight, screenWidth, unlocking }) {
  const materialRef = useRef(null);
  const progressRef = useRef(0);
  const renderedRef = useRef(-1);
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 240;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    return { canvas, context: canvas.getContext("2d"), texture };
  }, []);
  useEffect(() => { drawPhoneUnlockSlider(surface, 0); return () => surface.texture.dispose(); }, [surface]);
  useFrame((_, delta) => {
    progressRef.current = unlocking ? Math.min(1, progressRef.current + delta / 0.68) : 0;
    if (renderedRef.current !== progressRef.current) { renderedRef.current = progressRef.current; drawPhoneUnlockSlider(surface, progressRef.current); }
    if (materialRef.current) materialRef.current.opacity = 1 - Math.max(0, progressRef.current - 0.82) / 0.18;
  });
  const width = screenWidth * 0.84;
  return <group position={[0, -screenHeight * 0.39, 0.014 * normalDirection]} renderOrder={36} scale={[normalDirection, 1, 1]}><mesh renderOrder={36}><planeGeometry args={[width, width * (240 / 1024)]} /><meshBasicMaterial ref={materialRef} depthTest={false} depthWrite={false} map={surface.texture} side={DoubleSide} toneMapped={false} transparent /></mesh></group>;
}

export function ScreenHitButton({ onClick, onPointerOut, onPointerOver, position, renderOrder = 45, size }) {
  return <mesh position={position} renderOrder={renderOrder} onClick={(event) => { event.stopPropagation(); onClick(); }} onPointerOut={(event) => { event.stopPropagation(); onPointerOut(); }} onPointerOver={(event) => { event.stopPropagation(); onPointerOver(); }}><planeGeometry args={size} /><meshBasicMaterial depthTest={false} opacity={0} transparent side={DoubleSide} /></mesh>;
}
