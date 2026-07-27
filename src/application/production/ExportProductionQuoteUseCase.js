export class ExportProductionQuoteUseCase {
  constructor({ quotePdfExporter }) {
    if (!quotePdfExporter || typeof quotePdfExporter.export !== "function") {
      throw new TypeError("A quote PDF exporter is required.");
    }
    this.quotePdfExporter = quotePdfExporter;
  }

  execute(quoteData) {
    return this.quotePdfExporter.export(quoteData);
  }
}
