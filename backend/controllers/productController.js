const Product = require("../models/Product");
const TradeRequest = require("../models/TradeRequest");
const { fetchGovPriceRecommendation } = require("../services/govPriceService");
const { fetchMlPriceForecast } = require("../services/mlPriceService");
const { verifyOnChainProof } = require("../services/chainVerificationService");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeChainProof(rawProof) {
  if (rawProof === null || rawProof === undefined) {
    return null;
  }

  if (typeof rawProof !== "object" || Array.isArray(rawProof)) {
    throw createHttpError(400, "Invalid blockchain proof format.");
  }

  const txHash = String(rawProof.txHash || "").trim();
  const contractAddress = String(rawProof.contractAddress || "")
    .trim()
    .toLowerCase();
  const walletAddress = String(rawProof.walletAddress || "")
    .trim()
    .toLowerCase();
  const blockNumber = Number(rawProof.blockNumber);
  const chainId = Number(rawProof.chainId);

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw createHttpError(400, "Invalid transaction hash in blockchain proof.");
  }

  if (!Number.isInteger(blockNumber) || blockNumber < 0) {
    throw createHttpError(400, "Invalid block number in blockchain proof.");
  }

  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw createHttpError(400, "Invalid chain ID in blockchain proof.");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw createHttpError(400, "Invalid contract address in blockchain proof.");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw createHttpError(400, "Invalid wallet address in blockchain proof.");
  }

  return {
    txHash,
    blockNumber,
    chainId,
    contractAddress,
    walletAddress,
    recordedAt: new Date(),
  };
}

function sendControllerError(res, error, fallbackMessage) {
  const duplicateProductId =
    error?.code === 11000 &&
    (error?.keyPattern?.productId === 1 ||
      String(error?.message || "").includes("productId"));

  if (duplicateProductId) {
    return res.status(409).json({ message: "Product ID already exists." });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: fallbackMessage });
}

function parsePositivePrice(rawValue, fieldLabel) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw createHttpError(400, `${fieldLabel} should be a valid amount.`);
  }

  return Number(parsed.toFixed(2));
}

function clampNumber(rawValue, fallback, min, max) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function parseDaysAhead(rawValue) {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 14) {
    throw createHttpError(400, "daysAhead should be an integer from 1 to 14.");
  }

  return parsed;
}

function inferStateFromLocation(location) {
  const rawLocation = String(location || "").trim();
  if (!rawLocation) {
    return "";
  }

  const locationParts = rawLocation
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!locationParts.length) {
    return "";
  }

  return locationParts[locationParts.length - 1];
}

function normalizeStage(rawStage) {
  const stage = String(rawStage || "").trim();
  if (!stage) {
    throw createHttpError(400, "Please choose a status.");
  }

  if (stage.length > 80) {
    throw createHttpError(400, "Status is too long.");
  }

  return stage;
}

function isSameObjectId(valueA, valueB) {
  return String(valueA || "") === String(valueB || "");
}

async function ensureStageUpdateAuthorized(product, user) {
  if (!user || !product) {
    throw createHttpError(403, "You do not have permission for this action.");
  }

  if (user.role === "Farmer") {
    if (!isSameObjectId(product.createdBy, user._id)) {
      throw createHttpError(
        403,
        "Farmers can only update products they created.",
      );
    }

    return;
  }

  if (user.role === "Retailer") {
    const hasAcceptedRelationship = await TradeRequest.exists({
      retailer: user._id,
      farmer: product.createdBy,
      status: { $in: ["Accepted", "Closed"] },
    });

    if (!hasAcceptedRelationship) {
      throw createHttpError(
        403,
        "Retailer can update only products from farmers with accepted requests.",
      );
    }

    return;
  }

  throw createHttpError(403, "You do not have permission for this action.");
}

function sanitizePublicProduct(product) {
  const rawProduct = product?.toObject ? product.toObject() : product;
  const rawStages = Array.isArray(rawProduct?.stages) ? rawProduct.stages : [];

  return {
    productId: rawProduct.productId,
    name: rawProduct.name,
    farmerSellPrice: rawProduct.farmerSellPrice,
    retailPrice: rawProduct.retailPrice,
    pricingCurrency: rawProduct.pricingCurrency,
    qrUrl: rawProduct.qrUrl,
    isArchived: Boolean(rawProduct.isArchived),
    createdAt: rawProduct.createdAt,
    updatedAt: rawProduct.updatedAt,
    creationProof: rawProduct.creationProof || null,
    stages: rawStages.map((item) => ({
      stage: item.stage,
      updatedByName: item.updatedByName,
      updatedByRole: item.updatedByRole,
      updatedAt: item.updatedAt,
      chainProof: item.chainProof || null,
    })),
  };
}

async function createProduct(req, res) {
  try {
    const {
      productId,
      name,
      farmerSellPrice,
      pricingCurrency,
      chainProof: rawProof,
    } = req.body;

    if (!productId || !name || farmerSellPrice === undefined) {
      return res.status(400).json({ message: "Please enter product details." });
    }

    const parsedId = Number(productId);
    if (Number.isNaN(parsedId)) {
      return res
        .status(400)
        .json({ message: "Product ID should be a number." });
    }

    const normalizedName = String(name).trim();
    if (!normalizedName) {
      return res.status(400).json({ message: "Product name is required." });
    }

    if (normalizedName.length > 120) {
      return res.status(400).json({ message: "Product name is too long." });
    }

    const chainProof = normalizeChainProof(rawProof);
    if (!chainProof) {
      throw createHttpError(400, "Blockchain proof is required.");
    }
    const parsedFarmerSellPrice = parsePositivePrice(
      farmerSellPrice,
      "Farmer price",
    );
    const normalizedCurrency = String(pricingCurrency || "INR")
      .trim()
      .toUpperCase();

    const exists = await Product.findOne({ productId: parsedId });
    if (exists) {
      return res.status(409).json({ message: "Product ID already exists." });
    }

    await verifyOnChainProof({
      chainProof,
      expectedAction: "addProduct",
      expectedProductId: parsedId,
      expectedText: normalizedName,
    });

    const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
    const qrUrl = `${publicAppUrl}/product/${parsedId}`;

    const product = await Product.create({
      productId: parsedId,
      name: normalizedName,
      farmerSellPrice: parsedFarmerSellPrice,
      pricingCurrency: normalizedCurrency || "INR",
      qrUrl,
      createdBy: req.user._id,
      createdByName: req.user.name,
      createdByRole: req.user.role,
      creationProof: chainProof,
      stages: [],
    });

    return res.status(201).json({
      message: "Saved Successfully ✅",
      product,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Could not save product. Please try again.",
    );
  }
}

async function addStageMetadata(req, res) {
  try {
    const { productId } = req.params;
    const { stage, retailPrice, chainProof: rawProof } = req.body;
    const normalizedStage = normalizeStage(stage);

    const parsedId = Number(productId);
    if (Number.isNaN(parsedId)) {
      return res
        .status(400)
        .json({ message: "Product ID should be a number." });
    }

    const chainProof = normalizeChainProof(rawProof);
    if (!chainProof) {
      throw createHttpError(400, "Blockchain proof is required.");
    }
    const product = await Product.findOne({ productId: parsedId });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (product.isArchived) {
      return res
        .status(409)
        .json({ message: "Archived products cannot be updated." });
    }

    await ensureStageUpdateAuthorized(product, req.user);

    await verifyOnChainProof({
      chainProof,
      expectedAction: "addStage",
      expectedProductId: parsedId,
      expectedText: normalizedStage,
    });

    const includesRetailPrice =
      retailPrice !== undefined &&
      retailPrice !== null &&
      String(retailPrice).trim() !== "";

    if (req.user.role === "Retailer" && normalizedStage !== "At Market") {
      return res.status(403).json({
        message:
          "Retailer can update stage only when product reaches At Market.",
      });
    }

    if (req.user.role === "Farmer" && normalizedStage === "At Market") {
      return res.status(403).json({
        message: "Farmer cannot update stage to At Market.",
      });
    }

    if (includesRetailPrice) {
      if (req.user.role !== "Retailer") {
        return res
          .status(403)
          .json({ message: "Only retailer can set retail price." });
      }

      product.retailPrice = parsePositivePrice(retailPrice, "Retail price");
      product.retailPriceUpdatedAt = new Date();
    }

    product.stages.push({
      stage: normalizedStage,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedByRole: req.user.role,
      updatedAt: new Date(),
      chainProof,
    });

    await product.save();

    return res.json({
      message: "Updated ✅",
      product,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Could not update status. Please try again.",
    );
  }
}

async function getProductMetadata(req, res) {
  try {
    const parsedId = Number(req.params.productId);
    if (Number.isNaN(parsedId)) {
      return res
        .status(400)
        .json({ message: "Product ID should be a number." });
    }

    const product = await Product.findOne({ productId: parsedId });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json({ product: sanitizePublicProduct(product) });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not fetch product details." });
  }
}

async function getMyProducts(req, res) {
  try {
    const products = await Product.find({
      createdBy: req.user._id,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .select(
        "productId name createdAt farmerSellPrice retailPrice pricingCurrency qrUrl",
      );

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch your products." });
  }
}

async function getNextProductId(req, res) {
  try {
    const latestProduct = await Product.findOne({})
      .sort({ productId: -1 })
      .select("productId")
      .lean();

    const baseId =
      latestProduct && Number.isInteger(latestProduct.productId)
        ? latestProduct.productId + 1
        : 1001;

    return res.json({ nextProductId: baseId });
  } catch (error) {
    return res.status(500).json({ message: "Could not generate product ID." });
  }
}

async function getPriceRecommendation(req, res) {
  try {
    const crop = String(req.query.crop || req.query.commodity || "").trim();
    const requestedState = String(req.query.state || "").trim();
    const inferredState = inferStateFromLocation(
      req.user?.farmerProfile?.location,
    );
    const stateToUse = requestedState || inferredState;

    if (!crop) {
      return res
        .status(400)
        .json({ message: "Please enter a crop name to get recommendation." });
    }

    const recommendation = await fetchGovPriceRecommendation({
      commodity: crop,
      state: stateToUse,
    });

    return res.json({ recommendation });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Could not fetch government price recommendation.",
    );
  }
}

async function getMlPriceForecast(req, res) {
  try {
    const crop = String(req.query.crop || req.query.commodity || "").trim();
    const requestedState = String(req.query.state || "").trim();
    const inferredState = inferStateFromLocation(
      req.user?.farmerProfile?.location,
    );
    const stateToUse = requestedState || inferredState;

    if (!crop) {
      return res
        .status(400)
        .json({ message: "Please enter a crop name for ML forecast." });
    }

    const daysAhead = req.query.daysAhead
      ? parseDaysAhead(req.query.daysAhead)
      : 7;
    const averageRating = clampNumber(req.query.averageRating, 4.2, 1, 5);
    const reviewCount = Math.round(
      clampNumber(req.query.reviewCount, 150, 1, 10000),
    );
    const activeSupply = Math.round(
      clampNumber(req.query.activeSupply, 300, 1, 100000),
    );

    const forecast = await fetchMlPriceForecast({
      productName: crop,
      region: stateToUse,
      daysAhead,
      averageRating,
      reviewCount,
      activeSupply,
    });

    return res.json({ forecast });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Could not fetch ML price forecast.",
    );
  }
}

async function getShelfProducts(req, res) {
  try {
    const products = await Product.find({
      isArchived: false,
      retailPrice: { $ne: null },
      stages: {
        $elemMatch: {
          updatedBy: req.user._id,
          updatedByRole: "Retailer",
        },
      },
    })
      .sort({ retailPriceUpdatedAt: -1, updatedAt: -1 })
      .limit(30)
      .select(
        "productId name farmerSellPrice retailPrice pricingCurrency retailPriceUpdatedAt",
      );

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch shelf products." });
  }
}

async function getRetailerProductOptions(req, res) {
  try {
    const relationships = await TradeRequest.find({
      retailer: req.user._id,
      status: { $in: ["Accepted", "Closed"] },
    })
      .select("farmer")
      .lean();

    const farmerIds = [
      ...new Set(
        relationships.map((item) => String(item?.farmer || "")).filter(Boolean),
      ),
    ];

    if (!farmerIds.length) {
      return res.json({ products: [] });
    }

    const products = await Product.find({
      isArchived: false,
      createdBy: { $in: farmerIds },
    })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select("productId name createdByName updatedAt")
      .lean();

    return res.json({ products });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not fetch retailer product IDs." });
  }
}

async function archiveMyProduct(req, res) {
  try {
    const parsedId = Number(req.params.productId);
    if (Number.isNaN(parsedId)) {
      return res
        .status(400)
        .json({ message: "Product ID should be a number." });
    }

    const product = await Product.findOne({
      productId: parsedId,
      createdBy: req.user._id,
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found in your list." });
    }

    if (product.isArchived) {
      return res.status(409).json({ message: "Product is already archived." });
    }

    product.isArchived = true;
    product.archivedAt = new Date();
    product.archivedBy = req.user._id;
    product.archivedByName = req.user.name;
    await product.save();

    return res.json({ message: "Archived ✅" });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Could not archive product. Please try again.",
    );
  }
}

module.exports = {
  createProduct,
  addStageMetadata,
  getProductMetadata,
  getMyProducts,
  getNextProductId,
  getPriceRecommendation,
  getMlPriceForecast,
  getShelfProducts,
  getRetailerProductOptions,
  archiveMyProduct,
};
