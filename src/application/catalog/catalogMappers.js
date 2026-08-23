import { getCityById, getProvinceById } from "../../domain/catalog/locationCatalogs.js";
import { SAMPLE_CASTING, SAMPLE_EQUIPMENT, SAMPLE_LOCATIONS } from "./sampleRecords.js";

const SAMPLE_BY_KEY = new Map([...SAMPLE_CASTING, ...SAMPLE_LOCATIONS, ...SAMPLE_EQUIPMENT].map((record) => [record.id, record]));

function initials(name) {
  return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function money(value, unit) {
  return `$${Number(value || 0).toLocaleString("en-US")} por ${unit}`;
}

function rateLabel(rate, unit) {
  if (!rate) return null;
  const suffix = rate.negotiable ? " · negociable" : "";
  return `$${Number(rate.value).toLocaleString("en-US")} / ${unit}${suffix}`;
}

function numericRate(rate) {
  if (!rate || rate.value == null) return null;
  const value = Number(rate.value);
  return Number.isFinite(value) ? { ...rate, value } : null;
}

function mapImages(record, gateway) {
  return [...(record.images || [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)).map((item) => ({ ...item, url: gateway.resolveMediaUrl(item.url) }));
}

function sampleRecord(record) {
  const sample = SAMPLE_BY_KEY.get(record.sampleKey);
  if (!sample) return null;
  const images = sample.imageUrl ? Array(5).fill(null).map((_, index) => ({ id: `${sample.id}-${index}`, url: sample.imageUrl })) : [];
  return { ...sample, id: record.id, sampleKey: record.sampleKey, images, isSample: true };
}

export function mapCasting(record, gateway) {
  return sampleRecord(record) ?? {
    id: record.id,
    imageUrl: record.images?.[0]?.url ? gateway.resolveMediaUrl(record.images[0].url) : null,
    images: mapImages(record, gateway),
    initials: initials(record.fullName),
    name: record.fullName,
    specialty: "Talento audiovisual",
    details: [`${record.age} años`, `${(record.heightCm / 100).toFixed(2)} m`, record.experience],
    cardDetails: [`${record.age} años`, `${(record.heightCm / 100).toFixed(2)} m`],
    summary: record.experience,
    availability: record.availability,
    budget: [rateLabel(record.rates?.hourly, "hora"), rateLabel(record.rates?.daily, "jornada")].filter(Boolean).join(" · "),
    rates: {
      hourly: numericRate(record.rates?.hourly),
      daily: numericRate(record.rates?.daily),
    },
    isSample: false,
  };
}

export function mapLocation(record, gateway) {
  const sample = sampleRecord(record);
  if (sample) return sample;
  const provinceName = record.provinceName || getProvinceById(record.provinceId)?.name || record.province;
  const cityName = record.cityName || getCityById(record.cityId)?.name || record.city;
  return {
    id: record.id,
    imageUrl: record.images?.[0]?.url ? gateway.resolveMediaUrl(record.images[0].url) : null,
    images: mapImages(record, gateway),
    initials: initials(record.name),
    name: record.name,
    provinceId: record.provinceId,
    provinceName,
    cityId: record.cityId,
    cityName,
    specialty: [cityName, provinceName].filter(Boolean).join(", ") || "Locación audiovisual",
    details: [[cityName, provinceName].filter(Boolean).join(", "), record.address].filter(Boolean),
    cardDetails: [record.address].filter(Boolean),
    summary: record.description,
    availability: record.availability,
    budget: `${money(record.hourlyBudget, "hora")}${record.hourlyBudgetNegotiable ? " · negociable" : ""}`,
    hourlyBudget: record.hourlyBudget == null ? null : Number(record.hourlyBudget),
    hourlyBudgetNegotiable: Boolean(record.hourlyBudgetNegotiable),
    isSample: false,
  };
}

export function mapEquipment(record, gateway) {
  return sampleRecord(record) ?? {
    id: record.id,
    imageUrl: record.images?.[0]?.url ? gateway.resolveMediaUrl(record.images[0].url) : null,
    images: mapImages(record, gateway),
    initials: initials(record.name),
    name: record.name,
    specialty: record.category,
    details: String(record.specifications || "").split(",").map((detail) => detail.trim()).filter(Boolean),
    cardDetails: [],
    summary: record.specifications,
    availability: record.availability,
    budget: money(record.dailyRate, "día"),
    isSample: false,
  };
}

export function mapModerationRecord(record, kind, gateway) {
  return { ...record, kind, media: mapImages(record, gateway) };
}

function resolveMedia(item, gateway) {
  return item ? { ...item, url: gateway.resolveMediaUrl(item.url) } : null;
}

export function mapEquipmentAdmin(record, gateway) {
  return { ...record, images: (record.images || []).map((item) => resolveMedia(item, gateway)) };
}

export function mapPortfolio(record, gateway) {
  return { ...record, media: resolveMedia(record.media, gateway), cover: resolveMedia(record.cover, gateway) };
}

export function mapPage(response, mapper, gateway) {
  return { records: response.content.map((record) => mapper(record, gateway)), page: response.page, totalElements: response.totalElements, totalPages: response.totalPages, hasMore: !response.last };
}
