import { useMemo } from "react";
import { Shape } from "three";

export function ScreenGeometry({ cornerRadius, height, width }) {
  const shape = useMemo(() => {
    if (cornerRadius <= 0) return null;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const radius = Math.min(cornerRadius, halfWidth, halfHeight);
    const rectangle = new Shape();
    rectangle.moveTo(-halfWidth + radius, -halfHeight);
    rectangle.lineTo(halfWidth - radius, -halfHeight);
    rectangle.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
    rectangle.lineTo(halfWidth, halfHeight - radius);
    rectangle.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
    rectangle.lineTo(-halfWidth + radius, halfHeight);
    rectangle.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
    rectangle.lineTo(-halfWidth, -halfHeight + radius);
    rectangle.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
    rectangle.closePath();
    return rectangle;
  }, [cornerRadius, height, width]);
  return shape ? <shapeGeometry args={[shape]} /> : <planeGeometry args={[width, height]} />;
}
