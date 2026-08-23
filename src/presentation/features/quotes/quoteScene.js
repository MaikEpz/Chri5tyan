import {
  PHOTO_PACKAGES,
  QUOTE_EXTRA,
  hasProductionAssistant,
} from "../../../domain/production/productionQuote.js";

const PHOTO_LAYER_COUNTS = Object.freeze({
  [PHOTO_PACKAGES[0]]: 0,
  [PHOTO_PACKAGES[1]]: 1,
  [PHOTO_PACKAGES[2]]: 2,
  [PHOTO_PACKAGES[3]]: 3,
});

function createRepeatedLayers(kind, count, asset = kind) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${kind}-${index + 1}`,
    kind,
    asset,
    slot: index,
  }));
}

export function getQuoteSceneLayers(quote, production) {
  const cameraCount = Math.min(
    production.maximumCameras,
    Math.max(production.minimumCameras, quote.cameras),
  );
  const lightCount = Math.min(
    production.maximumLights,
    Math.max(production.minimumLights, quote.lights),
  );
  const castingCount = quote.castingSelections.length;
  const layers = [
    ...createRepeatedLayers("camera", cameraCount),
    ...createRepeatedLayers("light", lightCount, "softbox"),
    ...createRepeatedLayers("casting", castingCount),
  ];

  if (quote.makeup) {
    layers.push({ id: "makeup", kind: "makeup", asset: "makeup", slot: 0 });
  }
  if (quote.professionalSound) {
    layers.push({ id: "sound", kind: "sound", asset: "sound", slot: 0 });
  }
  if (hasProductionAssistant(quote)) {
    layers.push({ id: "gaffer", kind: "gaffer", asset: "gaffer", slot: 0 });
  }

  const photoCount = PHOTO_LAYER_COUNTS[quote.photos] ?? 0;
  layers.push(...createRepeatedLayers("photo", photoCount));

  if (quote.extras.includes(QUOTE_EXTRA.SMOKE_MACHINE)) {
    layers.push({ id: "smoke", kind: "smoke", asset: "smoke", slot: 0 });
  }
  if (quote.extras.includes(QUOTE_EXTRA.DRONE)) {
    layers.push({ id: "drone", kind: "drone", asset: "drone", slot: 0 });
  }
  if (quote.extras.includes(QUOTE_EXTRA.TELEPROMPTER)) {
    layers.push({
      id: "teleprompter",
      kind: "teleprompter",
      asset: "teleprompter",
      slot: 0,
    });
  }

  return layers;
}

export function describeQuoteScene(quote, production) {
  const details = [
    `${quote.cameras} ${quote.cameras === 1 ? "cámara" : "cámaras"}`,
    `${quote.lights} ${quote.lights === 1 ? "luz" : "luces"}`,
  ];

  if (quote.castingSelections.length > 0) {
    details.push(
      `${quote.castingSelections.length} ${quote.castingSelections.length === 1
        ? "persona de casting"
        : "personas de casting"}`,
    );
  }
  if (quote.makeup) details.push("estación de maquillaje");
  if (quote.professionalSound) details.push("sonido profesional");
  if (hasProductionAssistant(quote)) details.push("gaffer o asistente");
  if (quote.photos !== PHOTO_PACKAGES[0]) {
    details.push(`equipo fotográfico para ${quote.photos.toLowerCase()} fotografías`);
  }
  details.push(...quote.extras.map((extra) => extra.toLowerCase()));

  return `Set ${production.format.toLowerCase()} con ${details.join(", ")}.`;
}
