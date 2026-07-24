import assert from "node:assert/strict";
import test from "node:test";
import {
  QUOTE_EXTRA,
  changeQuoteQuantity,
  createProductionQuote,
  toggleQuoteExtra,
} from "../../src/domain/production/productionQuote.js";
import {
  PRODUCTION_TYPE,
  getProductionType,
} from "../../src/domain/production/productionTypes.js";
import {
  describeQuoteScene,
  getQuoteSceneLayers,
} from "../../src/presentation/features/quotes/quoteScene.js";

function sceneFor(quote) {
  return getQuoteSceneLayers(quote, getProductionType(quote.type));
}

function layerIds(quote) {
  return sceneFor(quote).map((layer) => layer.id);
}

function layersOfKind(quote, kind) {
  return sceneFor(quote).filter((layer) => layer.kind === kind);
}

test("el set vertical base de $80 tiene una cámara y dos luces", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  assert.deepEqual(layerIds(quote), ["camera-1", "light-1", "light-2"]);
});

test("el set horizontal base de $250 muestra todo el equipo incluido", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.SPOT);
  assert.deepEqual(layerIds(quote), [
    "camera-1",
    "camera-2",
    "light-1",
    "light-2",
    "light-3",
    "makeup",
    "sound",
    "gaffer",
  ]);
});

test("cámaras, luces y casting agregan y retiran una capa exacta", () => {
  const base = createProductionQuote(PRODUCTION_TYPE.REEL);
  const cameraAdded = changeQuoteQuantity(base, "cameras", 2);
  const lightAdded = changeQuoteQuantity(base, "lights", 3);
  const castingAdded = changeQuoteQuantity(base, "casting", 1);

  assert.equal(layersOfKind(cameraAdded, "camera").length, 2);
  assert.equal(layersOfKind(changeQuoteQuantity(cameraAdded, "cameras", 1), "camera").length, 1);
  assert.equal(layersOfKind(lightAdded, "light").length, 3);
  assert.equal(layersOfKind(changeQuoteQuantity(lightAdded, "lights", 2), "light").length, 2);
  assert.equal(layersOfKind(castingAdded, "casting").length, 1);
  assert.equal(layersOfKind(changeQuoteQuantity(castingAdded, "casting", 0), "casting").length, 0);
});

test("maquillaje, sonido y asistente controlan sus capas", () => {
  let quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  quote = { ...quote, makeup: true, professionalSound: true };
  quote = changeQuoteQuantity(quote, "lights", 3);

  assert.ok(layerIds(quote).includes("makeup"));
  assert.ok(layerIds(quote).includes("sound"));
  assert.ok(layerIds(quote).includes("gaffer"));

  quote = { ...quote, makeup: false, professionalSound: false };
  quote = changeQuoteQuantity(quote, "lights", 2);
  assert.equal(layerIds(quote).includes("makeup"), false);
  assert.equal(layerIds(quote).includes("sound"), false);
  assert.equal(layerIds(quote).includes("gaffer"), false);
});

test("cada paquete fotográfico agrega más equipo físico", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  const packageCounts = [
    ["Sin fotografías", 0],
    ["0 a 5", 1],
    ["5 a 10", 2],
    ["Más de 10", 3],
  ];

  packageCounts.forEach(([photos, expected]) => {
    assert.equal(layersOfKind({ ...quote, photos }, "photo").length, expected);
  });
});

test("cada extra tiene su representación visual", () => {
  const assetByExtra = {
    [QUOTE_EXTRA.SMOKE_MACHINE]: "smoke",
    [QUOTE_EXTRA.DRONE]: "drone",
    [QUOTE_EXTRA.TELEPROMPTER]: "teleprompter",
  };
  const base = createProductionQuote(PRODUCTION_TYPE.REEL);

  Object.entries(assetByExtra).forEach(([extra, layerId]) => {
    const quote = toggleQuoteExtra(base, extra);
    assert.ok(layerIds(quote).includes(layerId));
  });
});

test("horas y videos no alteran la escena", () => {
  const base = createProductionQuote(PRODUCTION_TYPE.REEL);
  const withHours = changeQuoteQuantity(base, "hours", 8);
  const withVideos = changeQuoteQuantity(base, "videos", 4);

  assert.deepEqual(layerIds(withHours), layerIds(base));
  assert.deepEqual(layerIds(withVideos), layerIds(base));
});

test("la escena expone una descripción accesible actualizada", () => {
  let quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  quote = changeQuoteQuantity(quote, "cameras", 2);
  quote = changeQuoteQuantity(quote, "lights", 3);
  quote = changeQuoteQuantity(quote, "casting", 1);
  quote = { ...quote, professionalSound: true };

  const description = describeQuoteScene(
    quote,
    getProductionType(PRODUCTION_TYPE.REEL),
  );

  assert.match(description, /Set vertical/);
  assert.match(description, /2 cámaras/);
  assert.match(description, /3 luces/);
  assert.match(description, /1 persona de casting/);
  assert.match(description, /sonido profesional/);
});
