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
    basePrice: 80,
    minimumCameras: 1,
    minimumLights: 2,
    maximumCameras: 4,
    maximumLights: 6,
    baseHours: 2,
    hoursPerExtraVideo: 1,
    makeupByDefault: false,
    professionalSoundByDefault: false,
    prices: Object.freeze({
      additionalCamera: 35,
      additionalLight: 15,
      additionalHour: 25,
      additionalVideo: 40,
      makeup: 30,
      professionalSound: 45,
      productionAssistant: 35,
      photos: Object.freeze({
        "Sin fotografías": 0,
        "0 a 5": 25,
        "5 a 10": 45,
        "Más de 10": 75,
      }),
      extras: Object.freeze({
        "Cámara de humo": 30,
        Drone: 90,
        Teleprompter: 40,
      }),
    }),
  }),
  [PRODUCTION_TYPE.SPOT]: Object.freeze({
    id: PRODUCTION_TYPE.SPOT,
    name: "Spot publicitario",
    format: "Horizontal",
    basePrice: 250,
    minimumCameras: 2,
    minimumLights: 3,
    maximumCameras: 4,
    maximumLights: 6,
    baseHours: 3,
    hoursPerExtraVideo: 2,
    makeupByDefault: true,
    professionalSoundByDefault: true,
    prices: Object.freeze({
      additionalCamera: 65,
      additionalLight: 25,
      additionalHour: 45,
      additionalVideo: 80,
      makeup: 0,
      professionalSound: 0,
      productionAssistant: 0,
      photos: Object.freeze({
        "Sin fotografías": 0,
        "0 a 5": 35,
        "5 a 10": 65,
        "Más de 10": 110,
      }),
      extras: Object.freeze({
        "Cámara de humo": 45,
        Drone: 140,
        Teleprompter: 60,
      }),
    }),
  }),
});

export function getProductionType(type) {
  const productionType = PRODUCTION_CATALOG[type];
  if (!productionType) {
    throw new Error(`Tipo de producción desconocido: ${type}`);
  }
  return productionType;
}
