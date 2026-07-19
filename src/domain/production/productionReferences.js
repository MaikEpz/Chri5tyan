import { PRODUCTION_TYPE } from "./productionTypes.js";

export const PRODUCTION_REFERENCES = Object.freeze([
  Object.freeze({
    id: "reference-reel-movimiento",
    imageId: "reference-reel-movimiento",
    type: PRODUCTION_TYPE.REEL,
    category: "Reel vertical",
    title: "Movimiento",
    client: "Marca de moda",
    description: "Una pieza breve enfocada en ritmo, textura y presencia de producto para redes sociales.",
    details: ["25 segundos", "Formato 9:16", "1 jornada"],
    services: ["Dirección", "Cámara", "Iluminación", "Edición"],
  }),
  Object.freeze({
    id: "reference-spot-origen",
    imageId: "reference-spot-origen",
    type: PRODUCTION_TYPE.SPOT,
    category: "Spot publicitario",
    title: "Origen",
    client: "Marca de café",
    description: "Un relato comercial que conecta el origen del producto con una experiencia cotidiana.",
    details: ["30 segundos", "16:9 + adaptación 9:16", "2 jornadas"],
    services: ["Producción", "Casting", "Sonido", "Color"],
  }),
  Object.freeze({
    id: "reference-cinema-ultima-luz",
    imageId: "reference-cinema-ultima-luz",
    type: PRODUCTION_TYPE.CINEMA,
    category: "Producción cine",
    title: "La última luz",
    client: "Cortometraje",
    description: "Una referencia narrativa construida alrededor de actuaciones íntimas y fotografía atmosférica.",
    details: ["12 minutos", "Formato cinematográfico", "Proyecto a medida"],
    services: ["Preproducción", "Dirección", "Fotografía", "Postproducción"],
  }),
]);
