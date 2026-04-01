const DEFAULT_DATASET_URL =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const DEFAULT_SOURCE_NAME = "AGMARKNET via data.gov.in";
const PROTOTYPE_SOURCE_NAME = "Prototype benchmark data";

const PROTOTYPE_CROP_PRICES = {
  rice: 2800,
  wheat: 2450,
  maize: 2150,
  tomato: 1900,
  onion: 2200,
  potato: 1750,
  cotton: 6400,
  soybean: 4700,
  banana: 3050,
  sugarcane: 380,
};

const PROTOTYPE_STATE_MULTIPLIERS = {
  karnataka: 1.02,
  maharashtra: 1.01,
  tamilnadu: 1.03,
  kerala: 1.06,
  andhrapradesh: 1.0,
  telangana: 1.0,
  gujarat: 1.01,
  rajasthan: 0.98,
  punjab: 1.02,
  haryana: 1.01,
  uttarpradesh: 0.99,
  madhyapradesh: 0.98,
  bihar: 0.97,
  westbengal: 1.01,
  odisha: 0.98,
};

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeToken(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function hashString(value) {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function parsePrice(value) {
  const parsed = Number(
    String(value || "")
      .replace(/,/g, "")
      .trim(),
  );
  return Number.isFinite(parsed) ? parsed : null;
}

function parseArrivalDate(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }

  const parts = raw.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => Number(part));
    if (
      Number.isInteger(day) &&
      Number.isInteger(month) &&
      Number.isInteger(year)
    ) {
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      return Number.isNaN(utcDate.getTime()) ? null : utcDate;
    }
  }

  const directDate = new Date(raw);
  return Number.isNaN(directDate.getTime()) ? null : directDate;
}

function roundToTwo(value) {
  return Number(value.toFixed(2));
}

function average(values) {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, current) => sum + current, 0);
  return total / values.length;
}

function sanitizeDatasetUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.delete("api-key");
  return url.toString();
}

function resolveMode() {
  const mode = normalizeText(process.env.GOVT_PRICE_MODE).toLowerCase();
  if (mode === "live" || mode === "prototype" || mode === "mock") {
    return mode;
  }
  return "auto";
}

function getPrototypeBasePrice(commodity) {
  const key = normalizeToken(commodity);
  if (PROTOTYPE_CROP_PRICES[key]) {
    return PROTOTYPE_CROP_PRICES[key];
  }

  // Keep unknown crops deterministic so demos feel consistent.
  return 1800 + (hashString(key || "crop") % 2200);
}

function getPrototypeStateMultiplier(state) {
  const key = normalizeToken(state);
  if (!key) {
    return 1;
  }

  if (PROTOTYPE_STATE_MULTIPLIERS[key]) {
    return PROTOTYPE_STATE_MULTIPLIERS[key];
  }

  const drift = ((hashString(key) % 9) - 4) / 100;
  return 1 + drift;
}

function getPrototypeSampleMarkets(state) {
  const label = normalizeText(state) || "India";
  return [
    {
      market: `${label} Central Mandi`,
      district: label,
      state: label,
    },
    {
      market: `${label} Agro Market`,
      district: label,
      state: label,
    },
    {
      market: `${label} Rural Yard`,
      district: label,
      state: label,
    },
  ];
}

function buildPrototypeRecommendation({ commodity, state, reason }) {
  const basePrice = getPrototypeBasePrice(commodity);
  const multiplier = getPrototypeStateMultiplier(state);
  const modalPrice = roundToTwo(basePrice * multiplier);
  const minPrice = roundToTwo(modalPrice * 0.9);
  const maxPrice = roundToTwo(modalPrice * 1.1);

  return {
    commodity,
    requestedState: state || null,
    scope: state ? "state" : "all",
    recommendationPriceInrPerQuintal: modalPrice,
    modalPriceAverageInrPerQuintal: modalPrice,
    minPriceAverageInrPerQuintal: minPrice,
    maxPriceAverageInrPerQuintal: maxPrice,
    recordsConsidered: 3,
    dataDate: new Date().toISOString().slice(0, 10),
    sampleMarkets: getPrototypeSampleMarkets(state),
    unit: "INR/quintal",
    source: {
      name: reason
        ? `${PROTOTYPE_SOURCE_NAME} (fallback: ${reason})`
        : PROTOTYPE_SOURCE_NAME,
      datasetUrl: null,
    },
  };
}

function buildDatasetUrl({ commodity, state, limit }) {
  const url = new URL(process.env.GOVT_PRICE_API_URL || DEFAULT_DATASET_URL);
  const apiKey = normalizeText(process.env.GOVT_DATA_API_KEY);

  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("filters[commodity]", commodity);

  if (state) {
    url.searchParams.set("filters[state]", state);
  }

  return url;
}

async function fetchGovRecords({ commodity, state, limit }) {
  const requestUrl = buildDatasetUrl({ commodity, state, limit });

  let response;
  try {
    response = await fetch(requestUrl.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw createServiceError(
      502,
      "Could not reach government market price service.",
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw createServiceError(
        502,
        "Government price API access denied. Check GOVT_DATA_API_KEY.",
      );
    }

    throw createServiceError(
      502,
      "Government market price service is unavailable right now.",
    );
  }

  const payload = await response.json();
  const records = Array.isArray(payload?.records) ? payload.records : [];

  const normalizedRecords = records
    .map((record) => ({
      market: normalizeText(record?.market || record?.market_name),
      district: normalizeText(record?.district),
      state: normalizeText(record?.state),
      modalPrice: parsePrice(record?.modal_price),
      minPrice: parsePrice(record?.min_price),
      maxPrice: parsePrice(record?.max_price),
      arrivalDate: parseArrivalDate(record?.arrival_date),
    }))
    .filter(
      (record) =>
        record.modalPrice !== null ||
        record.minPrice !== null ||
        record.maxPrice !== null,
    );

  return {
    records: normalizedRecords,
    requestUrl: requestUrl.toString(),
  };
}

async function fetchGovPriceRecommendation({ commodity, state, limit = 80 }) {
  const normalizedCommodity = normalizeText(commodity);
  const normalizedState = normalizeText(state);
  const mode = resolveMode();
  const hasApiKey = Boolean(normalizeText(process.env.GOVT_DATA_API_KEY));

  if (!normalizedCommodity) {
    throw createServiceError(400, "Crop name is required for recommendation.");
  }

  if (mode === "prototype" || mode === "mock") {
    return buildPrototypeRecommendation({
      commodity: normalizedCommodity,
      state: normalizedState,
    });
  }

  if (!hasApiKey) {
    if (mode === "live") {
      throw createServiceError(
        500,
        "GOVT_DATA_API_KEY is required when GOVT_PRICE_MODE=live.",
      );
    }

    return buildPrototypeRecommendation({
      commodity: normalizedCommodity,
      state: normalizedState,
      reason: "missing-api-key",
    });
  }

  let records;
  let requestUrl;
  let usedAllScopeFallback = false;

  try {
    const liveResult = await fetchGovRecords({
      commodity: normalizedCommodity,
      state: normalizedState,
      limit,
    });
    records = liveResult.records;
    requestUrl = liveResult.requestUrl;

    if (!records.length && normalizedState) {
      usedAllScopeFallback = true;
      const fallbackResult = await fetchGovRecords({
        commodity: normalizedCommodity,
        state: "",
        limit,
      });
      records = fallbackResult.records;
      requestUrl = fallbackResult.requestUrl;
    }
  } catch (error) {
    if (mode === "live") {
      throw error;
    }

    return buildPrototypeRecommendation({
      commodity: normalizedCommodity,
      state: normalizedState,
      reason: "live-source-unavailable",
    });
  }

  const usedStateScope =
    normalizedState && !usedAllScopeFallback ? "state" : "all";

  if (!records.length) {
    if (mode === "live") {
      throw createServiceError(
        404,
        "No government price data found for this crop right now.",
      );
    }

    return buildPrototypeRecommendation({
      commodity: normalizedCommodity,
      state: normalizedState,
      reason: "no-live-records",
    });
  }

  const recordsWithDate = records.filter((record) => record.arrivalDate);
  let focusRecords = records;
  let dataDate = null;

  if (recordsWithDate.length) {
    const latestTimestamp = Math.max(
      ...recordsWithDate.map((record) => record.arrivalDate.getTime()),
    );
    focusRecords = recordsWithDate.filter(
      (record) => record.arrivalDate.getTime() === latestTimestamp,
    );
    dataDate = new Date(latestTimestamp).toISOString().slice(0, 10);
  }

  const modalValues = focusRecords
    .map((record) => record.modalPrice)
    .filter((value) => value !== null);
  const minValues = focusRecords
    .map((record) => record.minPrice)
    .filter((value) => value !== null);
  const maxValues = focusRecords
    .map((record) => record.maxPrice)
    .filter((value) => value !== null);

  const modalAverage = average(modalValues);
  const minAverage = average(minValues);
  const maxAverage = average(maxValues);
  const fallbackAverage = average([...minValues, ...maxValues]);
  const recommendedPrice = modalAverage ?? fallbackAverage;

  if (recommendedPrice === null) {
    if (mode === "live") {
      throw createServiceError(
        404,
        "No usable government price points were found for this crop.",
      );
    }

    return buildPrototypeRecommendation({
      commodity: normalizedCommodity,
      state: normalizedState,
      reason: "invalid-live-prices",
    });
  }

  return {
    commodity: normalizedCommodity,
    requestedState: normalizedState || null,
    scope: usedStateScope,
    recommendationPriceInrPerQuintal: roundToTwo(recommendedPrice),
    modalPriceAverageInrPerQuintal:
      modalAverage === null ? null : roundToTwo(modalAverage),
    minPriceAverageInrPerQuintal:
      minAverage === null ? null : roundToTwo(minAverage),
    maxPriceAverageInrPerQuintal:
      maxAverage === null ? null : roundToTwo(maxAverage),
    recordsConsidered: focusRecords.length,
    dataDate,
    sampleMarkets: focusRecords.slice(0, 3).map((record) => ({
      market: record.market,
      district: record.district,
      state: record.state,
    })),
    unit: "INR/quintal",
    source: {
      name: DEFAULT_SOURCE_NAME,
      datasetUrl: sanitizeDatasetUrl(requestUrl),
    },
  };
}

module.exports = {
  fetchGovPriceRecommendation,
};
