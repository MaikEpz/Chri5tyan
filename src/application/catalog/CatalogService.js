import { CatalogAdministrationService } from "./CatalogAdministrationService.js";
import { CatalogModerationService } from "./CatalogModerationService.js";
import { CatalogSubmissionService } from "./CatalogSubmissionService.js";
import { PublicCatalogService } from "./PublicCatalogService.js";

export class CatalogService {
  constructor({ catalogGateway }) {
    this.publicCatalog = new PublicCatalogService({ catalogGateway });
    this.submissions = new CatalogSubmissionService({ catalogGateway });
    this.administration = new CatalogAdministrationService({ catalogGateway });
    this.moderation = new CatalogModerationService({ catalogGateway });
  }

  listCasting(parameters, signal) { return this.publicCatalog.listCasting(parameters, signal); }
  getCastingCatalogs(signal) { return this.publicCatalog.getCastingCatalogs(signal); }
  listLocations(parameters, signal) { return this.publicCatalog.listLocations(parameters, signal); }
  listEquipment(parameters, signal) { return this.publicCatalog.listEquipment(parameters, signal); }
  listPortfolio(parameters, signal) { return this.publicCatalog.listPortfolio(parameters, signal); }
  getProvinces(signal) { return this.publicCatalog.getProvinces(signal); }
  getCities(provinceId, signal) { return this.publicCatalog.getCities(provinceId, signal); }

  createCasting(data, images) { return this.submissions.createCasting(data, images); }
  updateCasting(id, data, images) { return this.submissions.updateCasting(id, data, images); }
  createLocation(data, images) { return this.submissions.createLocation(data, images); }
  getMyCasting(signal) { return this.submissions.getMyCasting(signal); }

  listEquipmentAdmin(parameters, signal) { return this.administration.listEquipmentAdmin(parameters, signal); }
  listPortfolioAdmin(parameters, signal) { return this.administration.listPortfolioAdmin(parameters, signal); }
  getCastingCatalogsAdmin(signal) { return this.administration.getCastingCatalogsAdmin(signal); }
  createCastingCatalogOption(type, data) { return this.administration.createCastingCatalogOption(type, data); }
  updateCastingCatalogOption(type, id, data) { return this.administration.updateCastingCatalogOption(type, id, data); }
  deleteCastingCatalogOption(type, id) { return this.administration.deleteCastingCatalogOption(type, id); }
  createEquipment(data, images) { return this.administration.createEquipment(data, images); }
  updateEquipment(id, data, images) { return this.administration.updateEquipment(id, data, images); }
  deleteEquipment(id) { return this.administration.deleteEquipment(id); }
  createPortfolioItem(data, media, cover) { return this.administration.createPortfolioItem(data, media, cover); }
  updatePortfolioItem(id, data, media, cover) { return this.administration.updatePortfolioItem(id, data, media, cover); }
  deletePortfolioItem(id) { return this.administration.deletePortfolioItem(id); }

  listCastingModeration(parameters, signal) { return this.moderation.listCastingModeration(parameters, signal); }
  listLocationsModeration(parameters, signal) { return this.moderation.listLocationsModeration(parameters, signal); }
  moderateCasting(id, decision) { return this.moderation.moderateCasting(id, decision); }
  moderateLocation(id, decision) { return this.moderation.moderateLocation(id, decision); }
}
