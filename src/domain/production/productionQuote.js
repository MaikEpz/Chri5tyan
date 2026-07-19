import { getProductionType } from "./productionTypes.js";

export const QUOTE_EXTRA = Object.freeze({
  SMOKE_MACHINE: "Cámara de humo",
  DRONE: "Drone",
  TELEPROMPTER: "Teleprompter",
});

export const PHOTO_PACKAGES = Object.freeze([
  "Sin fotografías",
  "0 a 5",
  "5 a 10",
  "Más de 10",
]);

export function createProductionQuote(type) {
  const production = getProductionType(type);
  return {
    type: production.id,
    cameras: production.minimumCameras,
    lights: production.minimumLights,
    videos: 1,
    hours: production.baseHours,
    casting: 0,
    makeup: production.makeupByDefault,
    professionalSound: production.professionalSoundByDefault,
    photos: PHOTO_PACKAGES[0],
    extras: [],
  };
}

export function getMinimumProductionHours(quote) {
  const production = getProductionType(quote.type);
  return production.baseHours + ((Math.max(1, quote.videos) - 1) * production.hoursPerExtraVideo);
}

export function hasProductionAssistant(quote) {
  return quote.lights > 2;
}

export function changeQuoteQuantity(quote, field, requestedValue) {
  const production = getProductionType(quote.type);
  const minimums = {
    cameras: production.minimumCameras,
    lights: production.minimumLights,
    videos: 1,
    casting: 0,
    hours: getMinimumProductionHours(quote),
  };
  if (!(field in minimums)) {
    throw new Error(`Cantidad de cotización desconocida: ${field}`);
  }

  const value = Math.max(minimums[field], Math.trunc(Number(requestedValue) || 0));
  const nextQuote = { ...quote, [field]: value };
  if (field === "videos") {
    nextQuote.hours = Math.max(quote.hours, getMinimumProductionHours(nextQuote));
  }
  return nextQuote;
}

export function toggleQuoteExtra(quote, extra) {
  const hasExtra = quote.extras.includes(extra);
  return {
    ...quote,
    extras: hasExtra
      ? quote.extras.filter((item) => item !== extra)
      : [...quote.extras, extra],
  };
}
