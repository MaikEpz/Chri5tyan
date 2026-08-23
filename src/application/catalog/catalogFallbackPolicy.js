import { SAMPLE_CASTING, SAMPLE_EQUIPMENT, SAMPLE_LOCATIONS } from "./sampleRecords.js";

const CASTING_FILTERS = Object.freeze({
  "casting-ana-torres": { age: 27, sexId: "10000000-0000-0000-0000-000000000001", cultureId: "30000000-0000-0000-0000-000000000001", availability: "Tardes y fines de semana", dailyRate: 120 },
  "casting-diego-morales": { age: 34, sexId: "10000000-0000-0000-0000-000000000002", cultureId: "30000000-0000-0000-0000-000000000001", availability: "Disponibilidad completa", dailyRate: 160 },
});
const LOCATION_FILTERS = Object.freeze({
  "location-loft-urdesa": { provinceId: "guayas", cityId: "guayaquil", city: "Guayaquil", availability: "08:00–18:00", budget: 45 },
  "location-casa-rio": { provinceId: "guayas", cityId: "samborondon", city: "Samborondón", availability: "07:00–19:00", budget: 65 },
});

function includesText(value, requested) {
  return !requested || String(value).toLocaleLowerCase("es").includes(String(requested).trim().toLocaleLowerCase("es"));
}

function filterFallback(records, query, category, predicate = () => true) {
  const normalized = String(query || "").trim().toLocaleLowerCase("es");
  return records.filter((record) => {
    const matchesCategory = !category || category === "Todos" || record.specialty === category;
    const haystack = `${record.name} ${record.specialty} ${record.summary || ""} ${record.details.join(" ")}`.toLocaleLowerCase("es");
    return matchesCategory && (!normalized || haystack.includes(normalized)) && predicate(record);
  }).map((record) => ({ ...record, sampleKey: record.id, isSample: true }));
}

export function castingFallback(parameters) {
  return filterFallback(SAMPLE_CASTING, parameters.q, null, (record) => {
    const metadata = CASTING_FILTERS[record.id];
    return (!parameters.sexId || metadata.sexId === parameters.sexId)
      && (!parameters.minAge || metadata.age >= Number(parameters.minAge))
      && (!parameters.cultureId || metadata.cultureId === parameters.cultureId)
      && (!parameters.rateUnit || parameters.rateUnit !== "DAILY" || !parameters.maxRate || metadata.dailyRate <= Number(parameters.maxRate))
      && includesText(metadata.availability, parameters.availability);
  });
}

export function locationFallback(parameters) {
  return filterFallback(SAMPLE_LOCATIONS, parameters.q, null, (record) => {
    const metadata = LOCATION_FILTERS[record.id];
    const matchesProvince = !parameters.provinceId || (record.provinceId || metadata?.provinceId) === parameters.provinceId;
    const matchesCity = !parameters.cityId || (record.cityId || metadata?.cityId) === parameters.cityId || (parameters.city && includesText(record.cityName || metadata?.city, parameters.city));
    return matchesProvince && matchesCity && includesText(metadata?.availability, parameters.availability) && (!parameters.maxBudget || metadata?.budget <= Number(parameters.maxBudget));
  });
}

export function equipmentFallback(parameters) {
  return filterFallback(SAMPLE_EQUIPMENT, parameters.q, parameters.category);
}

export function isRecoverableCatalogError(error) {
  return error?.code === "NETWORK_ERROR" || error?.status >= 500;
}
