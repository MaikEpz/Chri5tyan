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

export const QUOTE_RATE_UNIT = Object.freeze({
  HOURLY: "HOURLY",
  DAILY: "DAILY",
});

export function createProductionQuote(type) {
  const production = getProductionType(type);
  return {
    type: production.id,
    cameras: production.minimumCameras,
    lights: production.minimumLights,
    videos: 1,
    hours: production.baseHours,
    castingSelections: [],
    locationSelection: null,
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
  const selectedResources = {
    casting: [],
    location: null,
    total: 0,
  };

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
  quote.castingSelections.forEach((selection) => {
    const hourly = selection.rate.unit === QUOTE_RATE_UNIT.HOURLY;
    const line = addPriceLine(
      additions,
      `${selection.name} · Casting por ${hourly ? "hora" : "jornada"}`,
      hourly ? quote.hours : 1,
      selection.rate.value,
    );
    selectedResources.casting.push({
      kind: "CASTING",
      id: selection.id,
      name: selection.name,
      specialty: selection.specialty,
      availability: selection.availability,
      rateUnit: selection.rate.unit,
      negotiable: selection.rate.negotiable,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    });
  });

  if (quote.locationSelection) {
    const line = addPriceLine(
      additions,
      `${quote.locationSelection.name} · Locación por hora`,
      quote.hours,
      quote.locationSelection.rate.value,
    );
    selectedResources.location = {
      kind: "LOCATION",
      id: quote.locationSelection.id,
      name: quote.locationSelection.name,
      provinceName: quote.locationSelection.provinceName,
      cityName: quote.locationSelection.cityName,
      address: quote.locationSelection.address,
      availability: quote.locationSelection.availability,
      rateUnit: quote.locationSelection.rate.unit,
      negotiable: quote.locationSelection.rate.negotiable,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    };
  }

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
  selectedResources.total = selectedResources.casting.reduce(
    (total, item) => total + item.total,
    selectedResources.location?.total ?? 0,
  );
  return {
    additions,
    additionsTotal,
    basePrice: production.basePrice,
    selectedResources,
    total: production.basePrice + additionsTotal,
  };
}

export function changeQuoteQuantity(quote, field, requestedValue) {
  const production = getProductionType(quote.type);
  const minimums = {
    cameras: production.minimumCameras,
    lights: production.minimumLights,
    videos: 1,
    hours: getMinimumProductionHours(quote),
  };
  const maximums = {
    cameras: production.maximumCameras,
    lights: production.maximumLights,
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

export function setQuoteCastingSelections(quote, requestedSelections) {
  if (!Array.isArray(requestedSelections)) {
    throw new TypeError("Las selecciones de casting deben ser una lista.");
  }
  const selections = requestedSelections.map(normalizeCastingSelection);
  if (new Set(selections.map((selection) => selection.id)).size !== selections.length) {
    throw new RangeError("No se puede seleccionar el mismo perfil de casting más de una vez.");
  }
  return { ...quote, castingSelections: selections };
}

export function setQuoteLocationSelection(quote, requestedSelection) {
  return {
    ...quote,
    locationSelection: requestedSelection == null
      ? null
      : normalizeLocationSelection(requestedSelection),
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
  if (quantity === 0 || unitPrice <= 0) return null;
  const line = {
    id: `${label}-${lines.length}`,
    label,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
  lines.push(line);
  return line;
}

function normalizeCastingSelection(selection) {
  return {
    id: requiredText(selection?.id, "perfil de casting"),
    name: requiredText(selection?.name, "nombre del perfil"),
    specialty: String(selection?.specialty || ""),
    availability: String(selection?.availability || ""),
    rate: normalizeRate(selection?.rate, true),
  };
}

function normalizeLocationSelection(selection) {
  const rate = normalizeRate(selection?.rate, false);
  if (rate.unit !== QUOTE_RATE_UNIT.HOURLY) {
    throw new RangeError("La tarifa de la locación debe ser por hora.");
  }
  return {
    id: requiredText(selection?.id, "locación"),
    name: requiredText(selection?.name, "nombre de la locación"),
    provinceName: String(selection?.provinceName || ""),
    cityName: String(selection?.cityName || ""),
    address: String(selection?.address || ""),
    availability: String(selection?.availability || ""),
    rate,
  };
}

function normalizeRate(rate, allowDaily) {
  const unit = rate?.unit;
  if (unit !== QUOTE_RATE_UNIT.HOURLY && (!allowDaily || unit !== QUOTE_RATE_UNIT.DAILY)) {
    throw new RangeError("La modalidad de tarifa seleccionada no es válida.");
  }
  const value = Number(rate?.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError("La tarifa seleccionada debe ser un valor positivo.");
  }
  return { unit, value, negotiable: Boolean(rate?.negotiable) };
}

function requiredText(value, label) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new TypeError(`Falta ${label} en la selección.`);
  return normalized;
}
