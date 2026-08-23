import { mapModerationRecord } from "./catalogMappers.js";

export class CatalogSubmissionService {
  constructor({ catalogGateway }) {
    this.gateway = catalogGateway;
  }

  createCasting(data, images) { return this.gateway.createCasting(data, images); }
  updateCasting(id, data, images) { return this.gateway.updateCasting(id, data, images); }
  createLocation(data, images) { return this.gateway.createLocation(data, images); }

  async getMyCasting(signal) {
    const response = await this.gateway.listMyCasting({ page: 0, size: 1, sort: "createdAt,desc" }, signal);
    return response.content[0] ? mapModerationRecord(response.content[0], "casting", this.gateway) : null;
  }
}
