import { imageMultipart, queryString } from "../httpPayloads.js";

export class CatalogSubmissionApiGateway {
  constructor({ apiClient }) { this.apiClient = apiClient; }
  listMyCasting(parameters, signal) { return this.apiClient.request(`/api/v1/casting/mine${queryString(parameters)}`, { authenticated: true, signal }); }
  createCasting(data, images) { return this.apiClient.request("/api/v1/casting", { method: "POST", body: imageMultipart(data, images), authenticated: true }); }
  updateCasting(id, data, images) { return this.apiClient.request(`/api/v1/casting/${id}`, { method: "PUT", body: imageMultipart(data, images), authenticated: true }); }
  createLocation(data, images) { return this.apiClient.request("/api/v1/locations", { method: "POST", body: imageMultipart(data, images), authenticated: true }); }
}
