export class ModelAsset {
  constructor({ name, source }) {
    if (!name?.trim()) {
      throw new TypeError("ModelAsset requiere un nombre.");
    }
    if (!source) {
      throw new TypeError("ModelAsset requiere una fuente.");
    }
    this.name = name;
    this.source = source;
    Object.freeze(this);
  }
}
