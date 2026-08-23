import { QUOTE_RATE_UNIT } from "../../domain/production/productionQuote.js";

function numericPositiveRate(rate, unit) {
  if (!rate || rate.value == null) return null;
  const value = Number(rate.value);
  if (!Number.isFinite(value) || value <= 0) return null;
  return {
    unit,
    value,
    negotiable: Boolean(rate.negotiable),
  };
}

export function getCastingQuoteRates(record) {
  return [
    numericPositiveRate(record?.rates?.hourly, QUOTE_RATE_UNIT.HOURLY),
    numericPositiveRate(record?.rates?.daily, QUOTE_RATE_UNIT.DAILY),
  ].filter(Boolean);
}

export function canQuoteLocation(record) {
  return numericPositiveRate(
    record?.hourlyBudget == null
      ? null
      : {
          value: record.hourlyBudget,
          negotiable: record.hourlyBudgetNegotiable,
        },
    QUOTE_RATE_UNIT.HOURLY,
  ) !== null;
}

export function createCastingQuoteSelection(record, rate) {
  return {
    id: record.id,
    name: record.name,
    specialty: record.specialty,
    availability: record.availability,
    rate: {
      unit: rate.unit,
      value: Number(rate.value),
      negotiable: Boolean(rate.negotiable),
    },
  };
}

export function createLocationQuoteSelection(record) {
  return {
    id: record.id,
    name: record.name,
    provinceName: record.provinceName,
    cityName: record.cityName,
    address: record.address || record.details?.[1] || "",
    availability: record.availability,
    rate: {
      unit: QUOTE_RATE_UNIT.HOURLY,
      value: Number(record.hourlyBudget),
      negotiable: Boolean(record.hourlyBudgetNegotiable),
    },
  };
}
