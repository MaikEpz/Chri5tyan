import { queryString } from "../httpPayloads.js";

export class PublicCatalogApiGateway {
  constructor({ apiClient }) { this.apiClient = apiClient; }
  listCasting(parameters, signal) { return this.apiClient.request(`/api/v1/casting${queryString(parameters)}`, { signal }); }
  getCastingCatalogs(signal) { return this.apiClient.request("/api/v1/casting/catalogs", { signal }); }
  listLocations(parameters, signal) { return this.apiClient.request(`/api/v1/locations${queryString(parameters)}`, { signal }); }
  listEquipment(parameters, signal) { return this.apiClient.request(`/api/v1/equipment${queryString(parameters)}`, { signal }); }
  listPortfolio(parameters, signal) { return this.apiClient.request(`/api/v1/portfolio${queryString(parameters)}`, { signal }); }
  getProvinces(signal) { return this.apiClient.request("/api/v1/provinces", { signal }); }
  getCities(provinceId, signal) { return this.apiClient.request(`/api/v1/provinces/${provinceId}/cities`, { signal }); }
}
