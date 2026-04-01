const Product = require("../models/Product");
const TradeRequest = require("../models/TradeRequest");
const User = require("../models/User");

function roundNumber(value) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Number(parsed.toFixed(2));
}

function normalizeStatusCounts(rows) {
  const counts = {
    Pending: 0,
    Accepted: 0,
    Rejected: 0,
    Closed: 0,
  };

  rows.forEach((row) => {
    const key = String(row?._id || "").trim();
    if (counts[key] !== undefined) {
      counts[key] = Number(row.count || 0);
    }
  });

  return counts;
}

function normalizeRoleCounts(rows) {
  const counts = {
    Farmer: 0,
    Retailer: 0,
  };

  rows.forEach((row) => {
    const key = String(row?._id || "").trim();
    if (counts[key] !== undefined) {
      counts[key] = Number(row.count || 0);
    }
  });

  return counts;
}

function toRegionLabel(rawLocation) {
  const normalized = String(rawLocation || "").trim();
  if (!normalized) {
    return "Unknown";
  }

  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "Unknown";
  }

  return parts[parts.length - 1];
}

function buildTransparencyMap(farmers) {
  const regionCounts = new Map();

  farmers.forEach((farmer) => {
    const location = farmer?.farmerProfile?.location;
    const region = toRegionLabel(location);
    regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
  });

  const entries = [...regionCounts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (!entries.length) {
    return [
      { region: "Bengaluru", farms: 0, coveragePercent: 0 },
      { region: "Mandya", farms: 0, coveragePercent: 0 },
      { region: "Tumkur", farms: 0, coveragePercent: 0 },
      { region: "Kolar", farms: 0, coveragePercent: 0 },
      { region: "Chikkaballapur", farms: 0, coveragePercent: 0 },
    ];
  }

  const maxCount = Math.max(...entries.map((entry) => entry.count), 1);

  return entries.map((entry) => {
    const ratio = entry.count / maxCount;
    return {
      region: entry.region,
      farms: entry.count,
      coveragePercent: Math.max(20, Math.round(ratio * 100)),
    };
  });
}

function unitToKgMultiplier(unit) {
  const normalized = String(unit || "KG")
    .trim()
    .toUpperCase();

  if (normalized === "KG" || normalized === "KGS") {
    return 1;
  }

  if (normalized === "G" || normalized === "GRAM" || normalized === "GRAMS") {
    return 0.001;
  }

  if (normalized === "QUINTAL" || normalized === "QTL") {
    return 100;
  }

  if (normalized === "TON" || normalized === "TONNE" || normalized === "T") {
    return 1000;
  }

  return 1;
}

function formatLedgerEventTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toISOString();
}

async function getPlatformMetrics(req, res) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      roleRows,
      productSummaryRows,
      requestStatusRows,
      acceptedQuantityRows,
      recentProducts,
      recentRequests,
      farmers,
      newProducts24h,
      newRequests24h,
      productUpdatesHour,
      requestUpdatesHour,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ["$isArchived", true] }, 0, 1] },
            },
            archivedProducts: {
              $sum: { $cond: [{ $eq: ["$isArchived", true] }, 1, 0] },
            },
            totalFarmerValue: { $sum: { $ifNull: ["$farmerSellPrice", 0] } },
            totalRetailValue: { $sum: { $ifNull: ["$retailPrice", 0] } },
          },
        },
      ]),
      TradeRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      TradeRequest.aggregate([
        { $match: { status: "Accepted" } },
        {
          $group: {
            _id: "$unit",
            totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
          },
        },
      ]),
      Product.find({})
        .sort({ updatedAt: -1 })
        .limit(10)
        .select(
          "productId name updatedAt createdByName pricingCurrency farmerSellPrice retailPrice",
        )
        .lean(),
      TradeRequest.find({})
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("crop status quantity unit updatedAt retailerName farmerName")
        .lean(),
      User.find({ role: "Farmer" }).select("farmerProfile.location").lean(),
      Product.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      TradeRequest.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Product.countDocuments({ updatedAt: { $gte: oneHourAgo } }),
      TradeRequest.countDocuments({ updatedAt: { $gte: oneHourAgo } }),
    ]);

    const roleCounts = normalizeRoleCounts(roleRows);
    const requestCounts = normalizeStatusCounts(requestStatusRows);
    const productSummary = productSummaryRows[0] || {
      totalProducts: 0,
      activeProducts: 0,
      archivedProducts: 0,
      totalFarmerValue: 0,
      totalRetailValue: 0,
    };

    const acceptedQuantityKg = acceptedQuantityRows.reduce((sum, row) => {
      const multiplier = unitToKgMultiplier(row?._id);
      const quantity = Number(row?.totalQuantity || 0);
      return sum + quantity * multiplier;
    }, 0);

    const respondedCount = requestCounts.Accepted + requestCounts.Rejected;
    const fairnessRating = respondedCount
      ? Math.round((requestCounts.Accepted / respondedCount) * 100)
      : 0;

    const transparencyMap = buildTransparencyMap(farmers);

    const productEvents = recentProducts.map((product) => ({
      type: "product",
      timestamp: formatLedgerEventTime(product.updatedAt),
      title: `Batch ID: ${product.productId}`,
      subtitle: `${product.name} by ${product.createdByName || "Farmer"}`,
      detail: `${product.pricingCurrency || "INR"} ${roundNumber(product.farmerSellPrice)} farmer price`,
      tone: "green",
    }));

    const requestEvents = recentRequests.map((request) => ({
      type: "request",
      timestamp: formatLedgerEventTime(request.updatedAt),
      title: `${request.status} request`,
      subtitle: `${request.crop} from ${request.retailerName} to ${request.farmerName}`,
      detail: `${roundNumber(request.quantity)} ${String(request.unit || "KG").toUpperCase()}`,
      tone:
        request.status === "Accepted"
          ? "green"
          : request.status === "Rejected"
            ? "amber"
            : "slate",
    }));

    const ledgerStream = [...productEvents, ...requestEvents]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 14);

    return res.json({
      generatedAt: now.toISOString(),
      refreshIntervalSeconds: 15,
      headline: {
        totalValueTrackedInrLakhs: roundNumber(
          Number(productSummary.totalFarmerValue || 0) / 100000,
        ),
        fairnessRatingPercent: fairnessRating,
        foodWastePreventedKg: roundNumber(acceptedQuantityKg),
        transactionsCount:
          requestCounts.Pending +
          requestCounts.Accepted +
          requestCounts.Rejected +
          requestCounts.Closed,
      },
      totals: {
        users: roleCounts.Farmer + roleCounts.Retailer,
        farmers: roleCounts.Farmer,
        retailers: roleCounts.Retailer,
        products: Number(productSummary.totalProducts || 0),
        activeProducts: Number(productSummary.activeProducts || 0),
        archivedProducts: Number(productSummary.archivedProducts || 0),
        pendingRequests: requestCounts.Pending,
        acceptedRequests: requestCounts.Accepted,
        rejectedRequests: requestCounts.Rejected,
        closedRequests: requestCounts.Closed,
        totalRetailValueInr: roundNumber(productSummary.totalRetailValue || 0),
      },
      velocity: {
        newProductsLast24Hours: newProducts24h,
        newRequestsLast24Hours: newRequests24h,
        updatesLastHour: productUpdatesHour + requestUpdatesHour,
      },
      transparencyMap,
      ledgerStream,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not fetch platform metrics." });
  }
}

module.exports = {
  getPlatformMetrics,
};
