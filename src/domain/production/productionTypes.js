export const PRODUCTION_TYPE = Object.freeze({
  REEL: "reel",
  SPOT: "spot",
  CINEMA: "cinema",
});

export const PRODUCTION_CATALOG = Object.freeze({
  [PRODUCTION_TYPE.REEL]: Object.freeze({
    id: PRODUCTION_TYPE.REEL,
    name: "Reel",
    format: "Vertical",
    minimumCameras: 1,
    minimumLights: 2,
    baseHours: 2,
    hoursPerExtraVideo: 1,
    makeupByDefault: false,
    professionalSoundByDefault: false,
  }),
  [PRODUCTION_TYPE.SPOT]: Object.freeze({
    id: PRODUCTION_TYPE.SPOT,
    name: "Spot publicitario",
    format: "Horizontal / Vertical",
    minimumCameras: 2,
    minimumLights: 3,
    baseHours: 3,
    hoursPerExtraVideo: 2,
    makeupByDefault: true,
    professionalSoundByDefault: true,
  }),
});

export function getProductionType(type) {
  const productionType = PRODUCTION_CATALOG[type];
  if (!productionType) {
    throw new Error(`Tipo de producción desconocido: ${type}`);
  }
  return productionType;
}
