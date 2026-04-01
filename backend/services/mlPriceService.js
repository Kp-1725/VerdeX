const DEFAULT_ML_API_URL = "http://127.0.0.1:5001/api/price-prediction/predict";
const LIVE_SOURCE_NAME = "Random Forest model (Python service)";
const PROTOTYPE_SOURCE_NAME = "Prototype ML forecast";
const DEFAULT_PRICE_UNIT = "INR/kg";

const CROP_BASE_PRICE_INR = {
  rice: 62,
  wheat: 38,
  tomato: 46,
  onion: 30,
  potato: 24,
  soybean: 72,
  banana: 44,
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

function roundToTwo(value) {
  return Number(Number(value).toFixed(2));
}

function resolveMlMode() {
  const mode = normalizeText(process.env.ML_PRICE_MODE).toLowerCase();
  if (mode === "live" || mode === "prototype" || mode === "mock") {
    return mode;
  }
  return "auto";
}

function getBasePrice(productName) {
  const key = normalizeToken(productName);
  if (CROP_BASE_PRICE_INR[key]) {
    return CROP_BASE_PRICE_INR[key];
  }

  return 28 + (hashString(key || "crop") % 48);
}

function buildPrototypeForecast({ productName, region, daysAhead, reason }) {
  const basePrice = getBasePrice(productName);
  const today = new Date();

  const predictions = Array.from({ length: daysAhead }, (_, index) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + index);

    const trend = index * 0.2;
    const wave = Math.sin((index + 1) * 0.8) * 0.9;
    const predictedPrice = roundToTwo(basePrice + trend + wave);

    return {
      date: targetDate.toISOString().slice(0, 10),
      predictedPrice,
      lowerBound: roundToTwo(predictedPrice * 0.85),
      upperBound: roundToTwo(predictedPrice * 1.15),
      confidence: 0.8,
    };
  });

  return {
    productName,
    region: region || null,
    daysAhead,
    unit: DEFAULT_PRICE_UNIT,
    predictions,
    source: {
      name: reason
        ? `${PROTOTYPE_SOURCE_NAME} (fallback: ${reason})`
        : PROTOTYPE_SOURCE_NAME,
      mode: "prototype",
      apiUrl: null,
    },
  };
}

async function requestMlForecast(payload, endpoint) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw createServiceError(502, "ML prediction service returned an error.");
  }

  return response.json();
}

async function fetchMlPriceForecast({
  productName,
  region,
  daysAhead = 7,
  averageRating = 4.2,
  reviewCount = 150,
  activeSupply = 300,
}) {
  const normalizedProduct = normalizeText(productName);
  const normalizedRegion = normalizeText(region) || "Karnataka";
  const horizon = Math.max(1, Math.min(Number(daysAhead) || 7, 14));

  if (!normalizedProduct) {
    throw createServiceError(400, "Crop name is required for ML forecast.");
  }

  const mode = resolveMlMode();

  if (mode === "prototype" || mode === "mock") {
    return buildPrototypeForecast({
      productName: normalizedProduct,
      region: normalizedRegion,
      daysAhead: horizon,
    });
  }

  const endpoint =
    normalizeText(process.env.ML_PRICE_API_URL) || DEFAULT_ML_API_URL;

  try {
    const raw = await requestMlForecast(
      {
        product_name: normalizedProduct,
        farm_name: "VerdeX Network Farm",
        region: normalizedRegion,
        certification: "Organic",
        average_rating: Number(averageRating),
        review_count: Number(reviewCount),
        active_supply: Number(activeSupply),
        days_ahead: horizon,
      },
      endpoint,
    );

    const predictions = Array.isArray(raw?.predictions)
      ? raw.predictions.map((item) => ({
          date: String(item?.date || ""),
          predictedPrice: roundToTwo(
            item?.predicted_price || item?.predictedPrice || 0,
          ),
          lowerBound: roundToTwo(item?.lower_bound || item?.lowerBound || 0),
          upperBound: roundToTwo(item?.upper_bound || item?.upperBound || 0),
          confidence: Number(item?.confidence || 0.85),
        }))
      : [];

    const usablePredictions = predictions.filter(
      (item) => Number.isFinite(item.predictedPrice) && item.predictedPrice > 0,
    );

    if (!usablePredictions.length) {
      throw createServiceError(
        502,
        "ML prediction service returned invalid data.",
      );
    }

    return {
      productName: normalizedProduct,
      region: normalizedRegion,
      daysAhead: horizon,
      unit: DEFAULT_PRICE_UNIT,
      predictions: usablePredictions,
      source: {
        name: LIVE_SOURCE_NAME,
        mode: "live",
        apiUrl: endpoint,
      },
    };
  } catch (error) {
    if (mode === "live") {
      throw createServiceError(
        error?.statusCode || 502,
        error?.message || "ML prediction service is unavailable.",
      );
    }

    return buildPrototypeForecast({
      productName: normalizedProduct,
      region: normalizedRegion,
      daysAhead: horizon,
      reason: "ml-service-unavailable",
    });
  }
}

module.exports = {
  fetchMlPriceForecast,
};
