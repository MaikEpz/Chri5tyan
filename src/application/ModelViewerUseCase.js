export class ModelViewerUseCase {
  constructor({ modelAsset }) {
    this.modelAsset = modelAsset;
  }

  getModelAsset() {
    return this.modelAsset;
  }
}
