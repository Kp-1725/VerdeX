const express = require("express");
const {
  createProduct,
  addStageMetadata,
  getProductMetadata,
  getMyProducts,
  getNextProductId,
  getShelfProducts,
  archiveMyProduct,
} = require("../controllers/productController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/mine", requireAuth, authorizeRoles("Farmer"), getMyProducts);
router.get("/next-id", requireAuth, authorizeRoles("Farmer"), getNextProductId);
router.get("/shelf", requireAuth, authorizeRoles("Retailer"), getShelfProducts);
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
