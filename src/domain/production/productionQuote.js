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

export function calculateProductionQuote(quote) {
  const production = getProductionType(quote.type);
  const additions = [];

  addPriceLine(
    additions,
    "Cámara adicional",
    quote.cameras - production.minimumCameras,
    production.prices.additionalCamera,
  );
  addPriceLine(
    additions,
    "Luz adicional",
    quote.lights - production.minimumLights,
    production.prices.additionalLight,
  );
  addPriceLine(
    additions,
    "Hora adicional",
    quote.hours - production.baseHours,
    production.prices.additionalHour,
  );
  addPriceLine(
    additions,
    "Edición de video adicional",
    quote.videos - 1,
    production.prices.additionalVideo,
  );
  addPriceLine(
    additions,
    "Persona de casting",
    quote.casting,
    production.prices.castingPerson,
  );

  if (quote.makeup && !production.makeupByDefault) {
    addPriceLine(additions, "Maquillaje", 1, production.prices.makeup);
  }
  if (quote.professionalSound && !production.professionalSoundByDefault) {
    addPriceLine(additions, "Sonido profesional", 1, production.prices.professionalSound);
  }
  if (hasProductionAssistant(quote) && production.minimumLights <= 2) {
    addPriceLine(additions, "Gaffer / Asistente", 1, production.prices.productionAssistant);
  }

  addPriceLine(
    additions,
    `Fotografías: ${quote.photos}`,
    1,
    production.prices.photos[quote.photos] ?? 0,
  );
  quote.extras.forEach((extra) => {
    addPriceLine(additions, extra, 1, production.prices.extras[extra] ?? 0);
  });

  const additionsTotal = additions.reduce((total, item) => total + item.total, 0);
  return {
    additions,
    additionsTotal,
    basePrice: production.basePrice,
    total: production.basePrice + additionsTotal,
  };
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
  const maximums = {
    cameras: production.maximumCameras,
    lights: production.maximumLights,
    casting: production.maximumCasting,
  };
  if (!(field in minimums)) {
    throw new Error(`Cantidad de cotización desconocida: ${field}`);
  }

  const normalizedValue = Math.max(
    minimums[field],
    Math.trunc(Number(requestedValue) || 0),
  );
  const value = field in maximums
    ? Math.min(maximums[field], normalizedValue)
    : normalizedValue;
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

export function changeQuoteOption(quote, field, requestedValue) {
  if (field === "makeup" || field === "professionalSound") {
    if (typeof requestedValue !== "boolean") {
      throw new TypeError(`La opción ${field} debe ser booleana.`);
    }
    return { ...quote, [field]: requestedValue };
  }

  if (field === "photos") {
    if (!PHOTO_PACKAGES.includes(requestedValue)) {
      throw new RangeError(`Paquete de fotografías desconocido: ${requestedValue}`);
    }
    return { ...quote, photos: requestedValue };
  }

  throw new Error(`Opción de cotización desconocida: ${field}`);
}

function addPriceLine(lines, label, requestedQuantity, unitPrice) {
  const quantity = Math.max(0, Math.trunc(Number(requestedQuantity) || 0));
  if (quantity === 0 || unitPrice <= 0) return;
  lines.push({
    id: `${label}-${lines.length}`,
    label,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  });
}
