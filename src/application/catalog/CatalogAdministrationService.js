import { mapEquipmentAdmin, mapPage, mapPortfolio } from "./catalogMappers.js";

export class CatalogAdministrationService {
  constructor({ catalogGateway }) { this.gateway = catalogGateway; }
  async listEquipmentAdmin(parameters, signal) { return mapPage(await this.gateway.listEquipmentAdmin(parameters, signal), mapEquipmentAdmin, this.gateway); }
  async listPortfolioAdmin(parameters, signal) { return mapPage(await this.gateway.listPortfolioAdmin(parameters, signal), mapPortfolio, this.gateway); }
  getCastingCatalogsAdmin(signal) { return this.gateway.getCastingCatalogsAdmin(signal); }
  createCastingCatalogOption(type, data) { return this.gateway.createCastingCatalogOption(type, data); }
  updateCastingCatalogOption(type, id, data) { return this.gateway.updateCastingCatalogOption(type, id, data); }
  deleteCastingCatalogOption(type, id) { return this.gateway.deleteCastingCatalogOption(type, id); }
  createEquipment(data, images) { return this.gateway.createEquipment(data, images); }
  updateEquipment(id, data, images) { return this.gateway.updateEquipment(id, data, images); }
  deleteEquipment(id) { return this.gateway.deleteEquipment(id); }
  createPortfolioItem(data, media, cover) { return this.gateway.createPortfolioItem(data, media, cover); }
  updatePortfolioItem(id, data, media, cover) { return this.gateway.updatePortfolioItem(id, data, media, cover); }
  deletePortfolioItem(id) { return this.gateway.deletePortfolioItem(id); }
}
