export const PROVINCES = Object.freeze([
  { id: "guayas", name: "Guayas" },
  { id: "pichincha", name: "Pichincha" },
  { id: "azuay", name: "Azuay" },
  { id: "manabi", name: "Manabí" },
  { id: "el-oro", name: "El Oro" },
  { id: "tungurahua", name: "Tungurahua" },
  { id: "santa-elena", name: "Santa Elena" },
]);

export const CITIES = Object.freeze([
  // Guayas
  { id: "guayaquil", provinceId: "guayas", name: "Guayaquil" },
  { id: "samborondon", provinceId: "guayas", name: "Samborondón" },
  { id: "duran", provinceId: "guayas", name: "Durán" },
  { id: "daule", provinceId: "guayas", name: "Daule" },

  // Pichincha
  { id: "quito", provinceId: "pichincha", name: "Quito" },
  { id: "ruminahui", provinceId: "pichincha", name: "Rumiñahui (Sangolquí)" },
  { id: "cayambe", provinceId: "pichincha", name: "Cayambe" },

  // Azuay
  { id: "cuenca", provinceId: "azuay", name: "Cuenca" },
  { id: "gualaceo", provinceId: "azuay", name: "Gualaceo" },

  // Manabí
  { id: "manta", provinceId: "manabi", name: "Manta" },
  { id: "portoviejo", provinceId: "manabi", name: "Portoviejo" },
  { id: "montecristi", provinceId: "manabi", name: "Montecristi" },

  // El Oro
  { id: "machala", provinceId: "el-oro", name: "Machala" },

  // Tungurahua
  { id: "ambato", provinceId: "tungurahua", name: "Ambato" },
  { id: "banos", provinceId: "tungurahua", name: "Baños de Agua Santa" },

  // Santa Elena
  { id: "salinas", provinceId: "santa-elena", name: "Salinas" },
  { id: "montanita", provinceId: "santa-elena", name: "Montañita" },
]);

export function getProvinces() {
  return PROVINCES;
}

export function getCitiesByProvince(provinceId) {
  if (!provinceId) return [];
  return CITIES.filter((city) => city.provinceId === provinceId);
}

export function getProvinceById(provinceId) {
  return PROVINCES.find((prov) => prov.id === provinceId) || null;
}

export function getCityById(cityId) {
  return CITIES.find((city) => city.id === cityId) || null;
}
