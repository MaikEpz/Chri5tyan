import assert from "node:assert/strict";
import test from "node:test";
import {
  changeQuoteQuantity,
  createProductionQuote,
  getMinimumProductionHours,
  hasProductionAssistant,
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

test("los extras se agregan y eliminan sin mutar la cotización", () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  const withDrone = toggleQuoteExtra(quote, "Drone");
  const withoutDrone = toggleQuoteExtra(withDrone, "Drone");
  assert.deepEqual(quote.extras, []);
  assert.deepEqual(withDrone.extras, ["Drone"]);
  assert.deepEqual(withoutDrone.extras, []);
});
