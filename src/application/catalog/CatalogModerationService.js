import { mapModerationRecord, mapPage } from "./catalogMappers.js";

export class CatalogModerationService {
  constructor({ catalogGateway }) { this.gateway = catalogGateway; }
  async listCastingModeration(parameters, signal) { return mapPage(await this.gateway.listCastingAdmin(parameters, signal), (record, gateway) => mapModerationRecord(record, "casting", gateway), this.gateway); }
  async listLocationsModeration(parameters, signal) { return mapPage(await this.gateway.listLocationsAdmin(parameters, signal), (record, gateway) => mapModerationRecord(record, "location", gateway), this.gateway); }
  moderateCasting(id, decision) { return this.gateway.moderateCasting(id, decision); }
  moderateLocation(id, decision) { return this.gateway.moderateLocation(id, decision); }
}
