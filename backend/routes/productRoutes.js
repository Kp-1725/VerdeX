const express = require("express");
const {
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
} = require("../controllers/productController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/mine", requireAuth, authorizeRoles("Farmer"), getMyProducts);
router.get("/next-id", requireAuth, authorizeRoles("Farmer"), getNextProductId);
router.get(
  "/price-recommendation",
  requireAuth,
  authorizeRoles("Farmer"),
  getPriceRecommendation,
);
router.get(
  "/price-forecast",
  requireAuth,
  authorizeRoles("Farmer"),
  getMlPriceForecast,
);
router.get("/shelf", requireAuth, authorizeRoles("Retailer"), getShelfProducts);
router.get(
  "/retailer-options",
  requireAuth,
  authorizeRoles("Retailer"),
  getRetailerProductOptions,
);
router.delete(
  "/:productId",
  requireAuth,
  authorizeRoles("Farmer"),
  archiveMyProduct,
);
router.get("/:productId", getProductMetadata);
router.post("/", requireAuth, authorizeRoles("Farmer"), createProduct);
router.patch(
  "/:productId/stage",
  requireAuth,
  authorizeRoles("Farmer", "Retailer"),
  addStageMetadata,
);

module.exports = router;
