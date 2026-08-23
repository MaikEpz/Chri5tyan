import assert from "node:assert/strict";
import test from "node:test";
import {
  canQuoteLocation,
  createCastingQuoteSelection,
  createLocationQuoteSelection,
  getCastingQuoteRates,
} from "../../src/application/production/quoteResourceSelections.js";
import { QUOTE_RATE_UNIT } from "../../src/domain/production/productionQuote.js";

test("aplicación convierte el catálogo en comandos de cotización sin datos visuales", () => {
  const casting = {
    id: "casting-1",
    name: "Ana Torres",
    specialty: "Actriz",
    availability: "Tardes",
    imageUrl: "/ana.jpg",
    rates: {
      hourly: { value: 20, negotiable: true },
      daily: { value: 120, negotiable: false },
    },
  };
  const rates = getCastingQuoteRates(casting);
  const selection = createCastingQuoteSelection(casting, rates[1]);

  assert.deepEqual(rates.map((rate) => rate.unit), [
    QUOTE_RATE_UNIT.HOURLY,
    QUOTE_RATE_UNIT.DAILY,
  ]);
  assert.equal("imageUrl" in selection, false);
  assert.equal(selection.rate.value, 120);
});

test("aplicación excluye tarifas no positivas y crea una locación horaria", () => {
  assert.deepEqual(getCastingQuoteRates({
    rates: { hourly: { value: 0 }, daily: { value: "sin tarifa" } },
  }), []);
  assert.equal(canQuoteLocation({ hourlyBudget: 0 }), false);

  const location = createLocationQuoteSelection({
    id: "location-1",
    name: "Loft",
    cityName: "Guayaquil",
    provinceName: "Guayas",
    hourlyBudget: 45,
    hourlyBudgetNegotiable: true,
    imageUrl: "/loft.jpg",
  });
  assert.equal(location.rate.unit, QUOTE_RATE_UNIT.HOURLY);
  assert.equal(location.rate.value, 45);
  assert.equal("imageUrl" in location, false);
});
