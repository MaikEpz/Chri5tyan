import { getCitiesByProvince, getProvinces } from "../../domain/catalog/locationCatalogs.js";
import { castingFallback, equipmentFallback, isRecoverableCatalogError, locationFallback } from "./catalogFallbackPolicy.js";
import { mapCasting, mapEquipment, mapLocation, mapPage, mapPortfolio } from "./catalogMappers.js";

export class PublicCatalogService {
  constructor({ catalogGateway }) {
    this.gateway = catalogGateway;
  }

  listCasting(parameters, signal) {
    return this.load(() => this.gateway.listCasting(parameters, signal), mapCasting, () => castingFallback(parameters), parameters.page);
  }

  getCastingCatalogs(signal) {
    return this.gateway.getCastingCatalogs(signal);
  }

  listLocations(parameters, signal) {
    return this.load(() => this.gateway.listLocations(parameters, signal), mapLocation, () => locationFallback(parameters), parameters.page);
  }

  listEquipment(parameters, signal) {
    return this.load(() => this.gateway.listEquipment(parameters, signal), mapEquipment, () => equipmentFallback(parameters), parameters.page);
  }

  async listPortfolio(parameters, signal) {
    return mapPage(await this.gateway.listPortfolio(parameters, signal), mapPortfolio, this.gateway);
  }

  async getProvinces(signal) {
    try {
      return await this.gateway.getProvinces(signal);
    } catch (error) {
      if (!isRecoverableCatalogError(error)) throw error;
      return getProvinces();
    }
  }

  async getCities(provinceId, signal) {
    if (!provinceId) return [];
    try {
      return await this.gateway.getCities(provinceId, signal);
    } catch (error) {
      if (!isRecoverableCatalogError(error)) throw error;
      return getCitiesByProvince(provinceId);
    }
  }

  async load(request, mapper, fallback, page = 0) {
    try {
      const response = await request();
      return { records: response.content.map((record) => mapper(record, this.gateway)), hasMore: !response.last, fallback: false };
    } catch (error) {
      if (!isRecoverableCatalogError(error)) throw error;
      return { records: page === 0 ? fallback() : [], hasMore: false, fallback: true };
    }
  }
}
