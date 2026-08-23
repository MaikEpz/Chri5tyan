import { MathUtils } from "three";
import { SCREEN_VIEWS } from "../sceneConfig.js";

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

function drawRoundedRect(context, x, y, width, height, radius, fillStyle) {
  context.fillStyle = fillStyle;
  roundedRectPath(context, x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(context, x, y, width, height, radius) {
  roundedRectPath(context, x, y, width, height, radius);
  context.stroke();
}

export function drawCta(surface, color, label) {
  const { canvas, context, texture } = surface;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.font = "400 42px Poppins, Arial, sans-serif";
  context.letterSpacing = "3.65px";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label.toUpperCase(), canvas.width / 2, canvas.height / 2);
  texture.needsUpdate = true;
}

export function drawPhoneUnlockSlider(surface, progress) {
  const { canvas, context, texture } = surface;
  const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  const trackX = 8;
  const trackY = 18;
  const trackWidth = canvas.width - 16;
  const trackHeight = canvas.height - 36;
  const trackRadius = trackHeight / 2;
  const knobMargin = 12;
  const knobSize = trackHeight - knobMargin * 2;
  const knobX = MathUtils.lerp(trackX + knobMargin, trackX + trackWidth - knobMargin - knobSize, easedProgress);
  const knobY = trackY + knobMargin;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const trackGradient = context.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
  trackGradient.addColorStop(0, "rgba(82,82,86,0.97)");
  trackGradient.addColorStop(0.56, "rgba(61,61,65,0.97)");
  trackGradient.addColorStop(1, "rgba(45,45,49,0.97)");
  drawRoundedRect(context, trackX, trackY, trackWidth, trackHeight, trackRadius, trackGradient);
  context.strokeStyle = "rgba(255,255,255,0.14)";
  context.lineWidth = 3;
  strokeRoundedRect(context, trackX, trackY, trackWidth, trackHeight, trackRadius);
  context.fillStyle = `rgba(255,255,255,${Math.max(0, 0.84 * (1 - progress * 1.35))})`;
  context.font = "550 44px Inter, Arial, sans-serif";
  context.letterSpacing = "0px";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("Deslizar para desbloquear", trackX + trackWidth * 0.61, trackY + trackHeight * 0.52);
  context.shadowColor = "rgba(0,0,0,0.38)";
  context.shadowBlur = 22;
  context.shadowOffsetY = 8;
  drawRoundedRect(context, knobX, knobY, knobSize, knobSize, knobSize / 2, "#ffffff");
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  texture.needsUpdate = true;
}

export function drawMonitorPage(context, width, height, view, activeView, isFocused) {
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);
  drawRoundedRect(context, 36, 34, 126, 48, 12, "rgba(255,255,255,0.07)");
  context.strokeStyle = "rgba(255,255,255,0.2)";
  context.lineWidth = 2;
  strokeRoundedRect(context, 36, 34, 126, 48, 12);
  context.fillStyle = "#ffffff";
  context.font = "800 22px Inter, Arial, sans-serif";
  context.fillText(isFocused ? "Volver" : "Abrir", isFocused ? 58 : 64, 65);
  context.font = "800 34px Inter, Arial, sans-serif";
  context.fillText("Chris", 190, 66);
  SCREEN_VIEWS.forEach((screenView, index) => {
    const x = 520 + index * 150;
    const active = index === activeView;
    drawRoundedRect(context, x, 34, 126, 48, 12, active ? screenView.accent : "rgba(255,255,255,0.07)");
    context.strokeStyle = active ? screenView.accent : "rgba(255,255,255,0.2)";
    context.lineWidth = 2;
    strokeRoundedRect(context, x, 34, 126, 48, 12);
    context.fillStyle = active ? "#050505" : "#ffffff";
    context.font = "800 22px Inter, Arial, sans-serif";
    context.fillText(screenView.label, x + 20, 65);
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

export function drawLogoScreen(context, width, height, background) {
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
}
