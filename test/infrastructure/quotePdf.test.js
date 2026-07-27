import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProductionQuote,
  createProductionQuote,
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
