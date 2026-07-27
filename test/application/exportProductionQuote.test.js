import assert from "node:assert/strict";
import test from "node:test";
import { ExportProductionQuoteUseCase } from "../../src/application/production/ExportProductionQuoteUseCase.js";

test("delega la exportación en el puerto PDF configurado", async () => {
  const calls = [];
  const useCase = new ExportProductionQuoteUseCase({
    quotePdfExporter: {
      export: async (quoteData) => {
        calls.push(quoteData);
      },
    },
  });
  const quoteData = { quote: { type: "reel" }, pricing: { total: 80 } };

  await useCase.execute(quoteData);

  assert.deepEqual(calls, [quoteData]);
});

test("requiere un exportador PDF válido", () => {
  assert.throws(
    () => new ExportProductionQuoteUseCase({ quotePdfExporter: null }),
    /quote PDF exporter/i,
  );
});
