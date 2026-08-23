import { getCitiesByProvince, getProvinces } from "../../domain/catalog/locationCatalogs.js";

const ADMIN_USER = Object.freeze({
  id: "demo-admin",
  fullName: "Administrador demo",
  email: "admin",
  role: "ADMIN",
});

const CASTING_CATALOGS = Object.freeze({
  sexes: [
    { id: "demo-sex-female", name: "Femenino", displayOrder: 1, active: true },
    { id: "demo-sex-male", name: "Masculino", displayOrder: 2, active: true },
  ],
  skinTones: [
    { id: "demo-skin-light", name: "Claro", displayOrder: 1, active: true },
    { id: "demo-skin-medium", name: "Medio", displayOrder: 2, active: true },
    { id: "demo-skin-dark", name: "Oscuro", displayOrder: 3, active: true },
  ],
  cultures: [
    { id: "demo-culture-mestiza", name: "Mestiza", displayOrder: 1, active: true },
    { id: "demo-culture-afro", name: "Afroecuatoriana", displayOrder: 2, active: true },
  ],
});

const CASTING_RECORDS = [
  {
    id: "demo-casting-ana", fullName: "Ana Torres", age: 27, heightCm: 168,
    sex: { name: "Femenino" }, skinTone: { name: "Medio" },
    cultures: [{ name: "Mestiza" }], experience: "Experiencia intermedia en comerciales",
    availability: "Tardes y fines de semana", rates: { hourly: { value: 20, negotiable: true }, daily: { value: 120, negotiable: false } },
    status: "PENDING", createdAt: "2026-08-18T14:30:00Z", images: [],
  },
  {
    id: "demo-casting-diego", fullName: "Diego Morales", age: 34, heightCm: 180,
    sex: { name: "Masculino" }, skinTone: { name: "Medio" },
    cultures: [{ name: "Mestiza" }], experience: "Experiencia avanzada en cine y televisión",
    availability: "Disponibilidad completa", rates: { hourly: { value: 28, negotiable: false }, daily: { value: 160, negotiable: true } },
    status: "APPROVED", createdAt: "2026-08-12T10:00:00Z", images: [],
  },
];

const LOCATION_RECORDS = [
  {
    id: "demo-location-loft", name: "Loft Urdesa", address: "Urdesa Central",
    provinceId: "guayas", provinceName: "Guayas", cityId: "guayaquil", cityName: "Guayaquil",
    description: "Interior contemporáneo con luz natural", availability: "08:00–18:00",
    hourlyBudget: 45, hourlyBudgetNegotiable: false, status: "PENDING",
    createdAt: "2026-08-20T09:15:00Z", images: [],
  },
  {
    id: "demo-location-rio", name: "Casa del Río", address: "Vía Samborondón",
    provinceId: "guayas", provinceName: "Guayas", cityId: "samborondon", cityName: "Samborondón",
    description: "Casa con exteriores, jardín y piscina", availability: "07:00–19:00",
    hourlyBudget: 65, hourlyBudgetNegotiable: true, status: "APPROVED",
    createdAt: "2026-08-10T16:45:00Z", images: [],
  },
];

const EQUIPMENT_RECORDS = [
  { id: "demo-equipment-fx3", name: "Sony FX3", category: "Cámara", specifications: "Full Frame 4K, Montura E, 2 baterías", availability: "Disponible", dailyRate: 85, active: true, images: [] },
  { id: "demo-equipment-600d", name: "Aputure 600D Pro", category: "Iluminación", specifications: "Luz día, Bowens Mount, control inalámbrico", availability: "Disponible", dailyRate: 60, active: true, images: [] },
];

const PORTFOLIO_RECORDS = [
  { id: "demo-portfolio-origen", type: "PHOTO", title: "Origen", category: "Editorial", client: "Chris Studio", active: true, displayOrder: 1, media: null, cover: null },
  { id: "demo-portfolio-luz", type: "VIDEO", title: "Última luz", category: "Cine", client: "Chris Studio", active: true, displayOrder: 2, media: null, cover: null },
];

function page(records, parameters = {}) {
  const query = String(parameters.q || "").trim().toLocaleLowerCase("es");
  const filtered = records.filter((record) => {
    const matchesQuery = !query || JSON.stringify(record).toLocaleLowerCase("es").includes(query);
    const matchesStatus = !parameters.status || record.status === parameters.status;
    const matchesType = !parameters.type || record.type === parameters.type;
    const matchesActive = parameters.active == null || String(record.active) === String(parameters.active);
    return matchesQuery && matchesStatus && matchesType && matchesActive;
  });
  const pageNumber = Number(parameters.page || 0);
  const size = Number(parameters.size || filtered.length || 20);
  const content = filtered.slice(pageNumber * size, (pageNumber + 1) * size);
  return { content, page: pageNumber, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size), last: (pageNumber + 1) * size >= filtered.length };
}

function authError() {
  return Object.assign(new Error("Credenciales incorrectas. En la demo usa admin / admin."), {
    status: 401,
    code: "INVALID_CREDENTIALS",
  });
}

export class DemoGateway {
  constructor() {
    this.casting = structuredClone(CASTING_RECORDS);
    this.locations = structuredClone(LOCATION_RECORDS);
    this.equipment = structuredClone(EQUIPMENT_RECORDS);
    this.portfolio = structuredClone(PORTFOLIO_RECORDS);
    this.catalogs = structuredClone(CASTING_CATALOGS);
  }

  async login({ email, password }) {
    if (String(email).trim().toLowerCase() !== "admin" || password !== "admin") throw authError();
    return { accessToken: "demo-admin-token", expiresInSeconds: 60 * 60 * 24 * 7, user: { ...ADMIN_USER } };
  }

  async me() { return { ...ADMIN_USER }; }
  async register() { throw new Error("El registro estará disponible cuando se conecte el backend."); }
  async verifyEmail() { return { status: "VERIFIED" }; }
  async resendVerification() { return { accepted: true, retryAfterSeconds: 60 }; }

  async listCasting(parameters = {}) { return page([{ id: "casting-ana-torres", sampleKey: "casting-ana-torres" }, { id: "casting-diego-morales", sampleKey: "casting-diego-morales" }], parameters); }
  async listLocations(parameters = {}) { return page([{ id: "location-loft-urdesa", sampleKey: "location-loft-urdesa" }, { id: "location-casa-rio", sampleKey: "location-casa-rio" }], parameters); }
  async listEquipment(parameters = {}) { return page([{ id: "equipment-sony-fx3", sampleKey: "equipment-sony-fx3" }, { id: "equipment-aputure-600d", sampleKey: "equipment-aputure-600d" }], parameters); }
  async listPortfolio(parameters = {}) { return page([], parameters); }
  async getProvinces() { return getProvinces(); }
  async getCities(provinceId) { return getCitiesByProvince(provinceId); }
  async getCastingCatalogs() { return this.activeCatalogs(); }

  async listCastingAdmin(parameters = {}) { return page(this.casting, parameters); }
  async listLocationsAdmin(parameters = {}) { return page(this.locations, parameters); }
  async listEquipmentAdmin(parameters = {}) { return page(this.equipment, parameters); }
  async listPortfolioAdmin(parameters = {}) { return page(this.portfolio, parameters); }
  async getCastingCatalogsAdmin() { return structuredClone(this.catalogs); }

  async moderateCasting(id, decision) { return this.moderate(this.casting, id, decision); }
  async moderateLocation(id, decision) { return this.moderate(this.locations, id, decision); }
  async createEquipment(data) { return this.create(this.equipment, { ...data, images: [] }, "equipment"); }
  async updateEquipment(id, data) { return this.update(this.equipment, id, data); }
  async deleteEquipment(id) { return this.remove(this.equipment, id); }
  async createPortfolioItem(data) { return this.create(this.portfolio, { ...data, media: null, cover: null }, "portfolio"); }
  async updatePortfolioItem(id, data) { return this.update(this.portfolio, id, data); }
  async deletePortfolioItem(id) { return this.remove(this.portfolio, id); }

  async createCastingCatalogOption(type, data) {
    const collection = this.catalogCollection(type);
    return this.create(collection, data, type.toLowerCase());
  }

  async updateCastingCatalogOption(type, id, data) { return this.update(this.catalogCollection(type), id, data); }
  async deleteCastingCatalogOption(type, id) { return this.update(this.catalogCollection(type), id, { active: false }); }

  async listMyCasting() { return page([], {}); }
  async createCasting(data) { return this.create(this.casting, { ...data, status: "PENDING", images: [], createdAt: new Date().toISOString() }, "casting"); }
  async updateCasting(id, data) { return this.update(this.casting, id, data); }
  async createLocation(data) { return this.create(this.locations, { ...data, status: "PENDING", images: [], createdAt: new Date().toISOString() }, "location"); }
  async createCinemaRequest() { return { accepted: true, demo: true }; }
  resolveMediaUrl(path) { return path; }

  activeCatalogs() {
    return Object.fromEntries(Object.entries(this.catalogs).map(([key, options]) => [key, options.filter((option) => option.active)]));
  }

  catalogCollection(type) {
    return this.catalogs[{ SEX: "sexes", SKIN_TONE: "skinTones", CULTURE: "cultures" }[type]];
  }

  moderate(records, id, decision) {
    return this.update(records, id, { status: decision.status, rejectionReason: decision.reason });
  }

  create(records, data, prefix) {
    const record = { ...data, id: `demo-${prefix}-${Date.now()}` };
    records.push(record);
    return record;
  }

  update(records, id, data) {
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error("El registro de demostración ya no existe.");
    records[index] = { ...records[index], ...data, id };
    return records[index];
  }

  remove(records, id) {
    const index = records.findIndex((record) => record.id === id);
    if (index >= 0) records.splice(index, 1);
    return null;
  }
}
