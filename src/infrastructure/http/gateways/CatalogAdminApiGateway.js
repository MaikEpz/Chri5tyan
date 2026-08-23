import { imageMultipart, portfolioMultipart, queryString } from "../httpPayloads.js";

export class CatalogAdminApiGateway {
  constructor({ apiClient }) { this.apiClient = apiClient; }
  listEquipmentAdmin(parameters, signal) { return this.apiClient.request(`/api/v1/equipment/admin${queryString(parameters)}`, { authenticated: true, signal }); }
  listPortfolioAdmin(parameters, signal) { return this.apiClient.request(`/api/v1/portfolio/admin${queryString(parameters)}`, { authenticated: true, signal }); }
  listCastingAdmin(parameters, signal) { return this.apiClient.request(`/api/v1/casting/admin${queryString(parameters)}`, { authenticated: true, signal }); }
  getCastingCatalogsAdmin(signal) { return this.apiClient.request("/api/v1/casting/catalogs/admin", { authenticated: true, signal }); }
  createCastingCatalogOption(type, data) { return this.apiClient.request(`/api/v1/casting/catalogs/${type}`, { method: "POST", body: data, authenticated: true }); }
  updateCastingCatalogOption(type, id, data) { return this.apiClient.request(`/api/v1/casting/catalogs/${type}/${id}`, { method: "PUT", body: data, authenticated: true }); }
  deleteCastingCatalogOption(type, id) { return this.apiClient.request(`/api/v1/casting/catalogs/${type}/${id}`, { method: "DELETE", authenticated: true }); }
  listLocationsAdmin(parameters, signal) { return this.apiClient.request(`/api/v1/locations/admin${queryString(parameters)}`, { authenticated: true, signal }); }
  createEquipment(data, images) { return this.apiClient.request("/api/v1/equipment", { method: "POST", body: imageMultipart(data, images), authenticated: true }); }
  updateEquipment(id, data, images) { return this.apiClient.request(`/api/v1/equipment/${id}`, { method: "PUT", body: imageMultipart(data, images), authenticated: true }); }
  deleteEquipment(id) { return this.apiClient.request(`/api/v1/equipment/${id}`, { method: "DELETE", authenticated: true }); }
  createPortfolioItem(data, media, cover) { return this.apiClient.request("/api/v1/portfolio", { method: "POST", body: portfolioMultipart(data, media, cover), authenticated: true }); }
  updatePortfolioItem(id, data, media, cover) { return this.apiClient.request(`/api/v1/portfolio/${id}`, { method: "PUT", body: portfolioMultipart(data, media, cover), authenticated: true }); }
  deletePortfolioItem(id) { return this.apiClient.request(`/api/v1/portfolio/${id}`, { method: "DELETE", authenticated: true }); }
  moderateCasting(id, decision) { return this.apiClient.request(`/api/v1/casting/${id}/status`, { method: "PATCH", body: decision, authenticated: true }); }
  moderateLocation(id, decision) { return this.apiClient.request(`/api/v1/locations/${id}/status`, { method: "PATCH", body: decision, authenticated: true }); }
}
