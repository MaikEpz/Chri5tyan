import { useEffect, useMemo } from "react";
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three";
import { drawLogoScreen, drawMonitorPage } from "./monitorCanvas.js";

const WIDTH = 1024;
const HEIGHT = 390;
const PIXEL_RATIO = 2;

export function useMonitorPageTexture(view, activeView, isOpen, isFocused, idleBackground) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * PIXEL_RATIO;
    canvas.height = HEIGHT * PIXEL_RATIO;
    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    canvasTexture.minFilter = LinearMipmapLinearFilter;
    canvasTexture.magFilter = LinearFilter;
    canvasTexture.anisotropy = 8;
    canvasTexture.generateMipmaps = true;
    return canvasTexture;
  }, []);

  useEffect(() => {
    const context = texture.image.getContext("2d");
    context.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    if (isOpen) drawMonitorPage(context, WIDTH, HEIGHT, view, activeView, isFocused);
    else drawLogoScreen(context, WIDTH, HEIGHT, idleBackground);
    texture.needsUpdate = true;
  }, [activeView, idleBackground, isFocused, isOpen, texture, view]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
