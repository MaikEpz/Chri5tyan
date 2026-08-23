import { useEffect, useMemo, useRef } from "react";
import { Center } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { Color, DoubleSide, MathUtils, ShapeGeometry } from "three";
import { SVGLoader } from "three-stdlib";
import chrisLogoWhiteUrl from "../../../assets/branding/chris-logo.svg";

export function MonitorVectorLogo({ color, normalDirection, screenWidth }) {
  const materialRefs = useRef([]);
  const logoGroupRef = useRef(null);
  const logoScale = (screenWidth * 0.6) / 1368;
  const baseColor = useMemo(() => new Color(color), [color]);
  const svg = useLoader(SVGLoader, chrisLogoWhiteUrl);
  const geometries = useMemo(() => svg.paths.flatMap((path) => SVGLoader.createShapes(path).map((shape) => new ShapeGeometry(shape, 64))), [svg]);
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const brightness = MathUtils.clamp(0.95 + Math.sin(time * 0.82) * 0.032 + Math.sin(time * 2.1 + 0.8) * 0.018, 0.9, 1);
    materialRefs.current.forEach((material) => material?.color.copy(baseColor).multiplyScalar(brightness));
    logoGroupRef.current?.scale.setScalar(1 + Math.sin(time * 1.15) * 0.03);
  });
  return (
    <group ref={logoGroupRef} position={[0, 0, 0.004 * normalDirection]} renderOrder={31}>
      <Center precise><group scale={[logoScale * normalDirection, -logoScale, logoScale]}>{geometries.map((geometry, index) => <mesh key={index} geometry={geometry} renderOrder={31}><meshBasicMaterial ref={(material) => { materialRefs.current[index] = material; }} color={color} depthTest={false} depthWrite={false} side={DoubleSide} toneMapped={false} /></mesh>)}</group></Center>
    </group>
  );
}
