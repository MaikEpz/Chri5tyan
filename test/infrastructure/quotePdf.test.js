import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProductionQuote,
  createProductionQuote,
  QUOTE_RATE_UNIT,
  setQuoteCastingSelections,
  setQuoteLocationSelection,
} from "../../src/domain/production/productionQuote.js";
import {
  getProductionType,
  PRODUCTION_TYPE,
} from "../../src/domain/production/productionTypes.js";
import { createProductionQuotePdf } from "../../src/infrastructure/pdf/JsPdfQuoteExporter.js";

test("genera una cotización PDF válida", async () => {
  const quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  const production = getProductionType(quote.type);
  const pricing = calculateProductionQuote(quote);
  const pdf = await createProductionQuotePdf({
    quote,
    production,
    pricing,
    generatedAt: new Date("2026-07-26T12:00:00Z"),
  });
  const bytes = new Uint8Array(pdf.output("arraybuffer"));
  const signature = new TextDecoder().decode(bytes.slice(0, 5));

  assert.equal(signature, "%PDF-");
  assert.ok(bytes.length > 3000);
});

test("añade una segunda página con casting y locación", async () => {
  let quote = createProductionQuote(PRODUCTION_TYPE.REEL);
  quote = setQuoteCastingSelections(quote, [{
    id: "casting-1",
    name: "Ana Torres",
    specialty: "Actriz comercial",
    availability: "Tardes",
    rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 20, negotiable: true },
  }]);
  quote = setQuoteLocationSelection(quote, {
    id: "location-1",
    name: "Loft Urdesa",
    cityName: "Guayaquil",
    provinceName: "Guayas",
    availability: "08:00–18:00",
    rate: { unit: QUOTE_RATE_UNIT.HOURLY, value: 45 },
  });
  const production = getProductionType(quote.type);
  const pdf = await createProductionQuotePdf({
    quote,
    production,
    pricing: calculateProductionQuote(quote),
    generatedAt: new Date("2026-07-26T12:00:00Z"),
  });

  assert.equal(pdf.getNumberOfPages(), 2);
  assert.ok(new Uint8Array(pdf.output("arraybuffer")).length > 5000);
});
