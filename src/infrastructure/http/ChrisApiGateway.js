import { AuthApiGateway } from "./gateways/AuthApiGateway.js";
import { CatalogAdminApiGateway } from "./gateways/CatalogAdminApiGateway.js";
import { CatalogSubmissionApiGateway } from "./gateways/CatalogSubmissionApiGateway.js";
import { CinemaApiGateway } from "./gateways/CinemaApiGateway.js";
import { PublicCatalogApiGateway } from "./gateways/PublicCatalogApiGateway.js";

export class ChrisApiGateway {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
    this.auth = new AuthApiGateway({ apiClient });
    this.publicCatalog = new PublicCatalogApiGateway({ apiClient });
    this.submissions = new CatalogSubmissionApiGateway({ apiClient });
    this.admin = new CatalogAdminApiGateway({ apiClient });
    this.cinema = new CinemaApiGateway({ apiClient });
  }

  login(credentials) { return this.auth.login(credentials); }
  register(account) { return this.auth.register(account); }
  verifyEmail(token) { return this.auth.verifyEmail(token); }
  resendVerification(email) { return this.auth.resendVerification(email); }
  me() { return this.auth.me(); }

  listCasting(parameters, signal) { return this.publicCatalog.listCasting(parameters, signal); }
  getCastingCatalogs(signal) { return this.publicCatalog.getCastingCatalogs(signal); }
  listLocations(parameters, signal) { return this.publicCatalog.listLocations(parameters, signal); }
  listEquipment(parameters, signal) { return this.publicCatalog.listEquipment(parameters, signal); }
  listPortfolio(parameters, signal) { return this.publicCatalog.listPortfolio(parameters, signal); }
  getProvinces(signal) { return this.publicCatalog.getProvinces(signal); }
  getCities(provinceId, signal) { return this.publicCatalog.getCities(provinceId, signal); }

  listMyCasting(parameters, signal) { return this.submissions.listMyCasting(parameters, signal); }
  createCasting(data, images) { return this.submissions.createCasting(data, images); }
  updateCasting(id, data, images) { return this.submissions.updateCasting(id, data, images); }
  createLocation(data, images) { return this.submissions.createLocation(data, images); }

  listEquipmentAdmin(parameters, signal) { return this.admin.listEquipmentAdmin(parameters, signal); }
  listPortfolioAdmin(parameters, signal) { return this.admin.listPortfolioAdmin(parameters, signal); }
  listCastingAdmin(parameters, signal) { return this.admin.listCastingAdmin(parameters, signal); }
  getCastingCatalogsAdmin(signal) { return this.admin.getCastingCatalogsAdmin(signal); }
  createCastingCatalogOption(type, data) { return this.admin.createCastingCatalogOption(type, data); }
  updateCastingCatalogOption(type, id, data) { return this.admin.updateCastingCatalogOption(type, id, data); }
  deleteCastingCatalogOption(type, id) { return this.admin.deleteCastingCatalogOption(type, id); }
  listLocationsAdmin(parameters, signal) { return this.admin.listLocationsAdmin(parameters, signal); }
  createEquipment(data, images) { return this.admin.createEquipment(data, images); }
  updateEquipment(id, data, images) { return this.admin.updateEquipment(id, data, images); }
  deleteEquipment(id) { return this.admin.deleteEquipment(id); }
  createPortfolioItem(data, media, cover) { return this.admin.createPortfolioItem(data, media, cover); }
  updatePortfolioItem(id, data, media, cover) { return this.admin.updatePortfolioItem(id, data, media, cover); }
  deletePortfolioItem(id) { return this.admin.deletePortfolioItem(id); }
  moderateCasting(id, decision) { return this.admin.moderateCasting(id, decision); }
  moderateLocation(id, decision) { return this.admin.moderateLocation(id, decision); }

  createCinemaRequest(data) { return this.cinema.createCinemaRequest(data); }
  resolveMediaUrl(path) { return this.apiClient.resolveUrl(path); }
}
