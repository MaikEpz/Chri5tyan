import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProductionQuote,
  changeQuoteOption,
  changeQuoteQuantity,
  createProductionQuote,
  getMinimumProductionHours,
  hasProductionAssistant,
  QUOTE_RATE_UNIT,
  setQuoteCastingSelections,
  setQuoteLocationSelection,
  toggleQuoteExtra,
} from "../../src/domain/production/productionQuote.js";
import { PRODUCTION_TYPE } from "../../src/domain/production/productionTypes.js";

test("un reel nace con los mínimos del negocio", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  assert.equal(quote.cameras, 1);
  assert.equal(quote.lights, 2);
  assert.equal(quote.hours, 2);
  assert.equal(quote.makeup, false);
});

test("un spot nace con sonido profesional y asistente", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.SPOT);
  assert.equal(quote.cameras, 2);
  assert.equal(quote.lights, 3);
  assert.equal(quote.professionalSound, true);
  assert.equal(hasProductionAssistant(quote), true);
});

test("cada entrega adicional eleva el mínimo de horas", () => {
  const reel = changeQuoteQuantity(createProductionQuote(PRODUCTION_TYPE.REEL), "videos", 3);
  const spot = changeQuoteQuantity(createProductionQuote(PRODUCTION_TYPE.SPOT), "videos", 3);
  assert.equal(getMinimumProductionHours(reel), 4);
  assert.equal(reel.hours, 4);
  assert.equal(getMinimumProductionHours(spot), 7);
  assert.equal(spot.hours, 7);
});

test("ninguna cantidad puede bajar de su mínimo", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.SPOT);
  assert.equal(changeQuoteQuantity(quote, "cameras", 0).cameras, 2);
  assert.equal(changeQuoteQuantity(quote, "lights", 1).lights, 3);
  assert.equal(changeQuoteQuantity(quote, "hours", 0).hours, 3);
});

test("los recursos físicos respetan máximos de cámaras y luces", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);

  assert.equal(changeQuoteQuantity(quote, "cameras", 99).cameras, 4);
  assert.equal(changeQuoteQuantity(quote, "lights", 99).lights, 6);
});

test("los extras se agregan y eliminan sin mutar la cotización", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  const withDrone = toggleQuoteExtra(quote, "Drone");
  const withoutDrone = toggleQuoteExtra(withDrone, "Drone");
  assert.deepEqual(quote.extras, []);
  assert.deepEqual(withDrone.extras, ["Drone"]);
  assert.deepEqual(withoutDrone.extras, []);
});

test("las opciones solo aceptan campos y valores conocidos", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);

  assert.equal(changeQuoteOption(quote, "makeup", true).makeup, true);
  assert.equal(changeQuoteOption(quote, "photos", "0 a 5").photos, "0 a 5");
  assert.throws(
    () => changeQuoteOption(quote, "makeup", "sí"),
    /debe ser booleana/,
  );
  assert.throws(
    () => changeQuoteOption(quote, "photos", "Paquete inventado"),
    /Paquete de fotografías desconocido/,
  );
  assert.throws(
    () => changeQuoteOption(quote, "type", PRODUCTION_TYPE.SPOT),
    /Opción de cotización desconocida/,
  );
});

test("los paquetes base cuestan 80 y 250 dólares", () => {
  const reel = calculateProductionQuote(createProductionQuote(PRODUCTION_TYPE.REEL));
  const spot = calculateProductionQuote(createProductionQuote(PRODUCTION_TYPE.SPOT));

  assert.equal(reel.total, 80);
  assert.equal(spot.total, 250);
  assert.deepEqual(reel.additions, []);
  assert.deepEqual(spot.additions, []);
});

test("cada recurso adicional aumenta el total del reel", () => {
  let quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  quote = changeQuoteQuantity(quote, "cameras", 2);
  quote = changeQuoteQuantity(quote, "lights", 3);
  quote = { ...quote, makeup: true, professionalSound: true, photos: "0 a 5" };
  quote = toggleQuoteExtra(quote, "Drone");

  const pricing = calculateProductionQuote(quote);

  assert.equal(pricing.total, 355);
  assert.equal(pricing.additionsTotal, 275);
});

test("un video horizontal adicional cobra edición y horas requeridas", () => {
  const quote = changeQuoteQuantity(
    createProductionQuote(PRODUCTION_TYPE.SPOT),
    "videos",
    2,
  );
  const pricing = calculateProductionQuote(quote);

  assert.equal(quote.hours, 5);
  assert.equal(pricing.total, 420);
});

test("suma perfiles y locación directamente desde las selecciones", () => {
  let quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  quote = setQuoteCastingSelections(quote, [
    {
      id: "casting-1",
      name: "Ana Torres",
      rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 20, negotiable: true },
    },
    {
      id: "casting-2",
      name: "Diego Morales",
      rate: { unit: QUOTE_RATE_UNIT.DAILY, value: 160, negotiable: false },
    },
  ]);
  quote = setQuoteLocationSelection(quote, {
    id: "location-1",
    name: "Loft Urdesa",
    rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 45, negotiable: false },
  });

  const pricing = calculateProductionQuote(quote);

  assert.equal(pricing.total, 370);
  assert.deepEqual(
    pricing.additions.map((item) => [item.label, item.quantity, item.total]),
    [
      ["Ana Torres · Casting por hora", 2, 40],
      ["Diego Morales · Casting por jornada", 1, 160],
      ["Loft Urdesa · Locación por hora", 2, 90],
    ],
  );
  assert.deepEqual(
    pricing.selectedResources.casting.map((item) => ({
      id: item.id,
      rateUnit: item.rateUnit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    [
      { id: "casting-1", rateUnit: QUOTE_RATE_UNIT.HOURLY, quantity: 2, unitPrice: 20, total: 40 },
      { id: "casting-2", rateUnit: QUOTE_RATE_UNIT.DAILY, quantity: 1, unitPrice: 160, total: 160 },
    ],
  );
  assert.equal(pricing.selectedResources.location.total, 90);
  assert.equal(pricing.selectedResources.total, 290);
});

test("recalcula las selecciones horarias al cambiar la duración", () => {
  let quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  quote = setQuoteCastingSelections(quote, [{
    id: "casting-1",
    name: "Ana Torres",
    rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 20 },
  }]);
  quote = setQuoteLocationSelection(quote, {
    id: "location-1",
    name: "Loft Urdesa",
    rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 45 },
  });
  quote = changeQuoteQuantity(quote, "hours", 4);

  assert.equal(calculateProductionQuote(quote).total, 390);
});

test("permite una cantidad dinámica de perfiles y evita duplicados", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  const selection = (id) => ({
    id,
    name: `Perfil ${id}`,
    rate: { unit: QUOTE_RATE_UNIT.DAILY, value: 100 },
  });

  assert.equal(
    setQuoteCastingSelections(quote, [1, 2, 3, 4, 5, 6].map(selection)).castingSelections.length,
    6,
  );
  assert.throws(
    () => setQuoteCastingSelections(quote, [selection("1"), selection("1")]),
    /mismo perfil/,
  );
});

test("el dominio conserva solo datos cotizables y exige tarifas positivas", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  const selected = setQuoteCastingSelections(quote, [{
    id: "casting-1",
    name: "Ana Torres",
    imageUrl: "https://cdn.example.com/ana.jpg",
    rate: { unit: QUOTE_RATE_UNIT.DAILY, value: 120 },
  }]);

  assert.equal("imageUrl" in selected.castingSelections[0], false);
  assert.throws(
    () => setQuoteCastingSelections(quote, [{
      id: "casting-free",
      name: "Sin tarifa",
      rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 0 },
    }]),
    /valor positivo/,
  );
});
