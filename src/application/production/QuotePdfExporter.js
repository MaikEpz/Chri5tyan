export class QuotePdfExporter {
  async export() {
    throw new Error("QuotePdfExporter.export must be implemented by an adapter.");
  }
}
