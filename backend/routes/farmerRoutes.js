const express = require("express");
const {
  upsertMyFarmerProfile,
  listFarmers,
  getFarmerById,
} = require("../controllers/farmerController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.patch(
  "/me/profile",
  requireAuth,
  authorizeRoles("Farmer"),
  upsertMyFarmerProfile,
);
router.get("/", requireAuth, authorizeRoles("Farmer", "Retailer"), listFarmers);
router.get(
  "/:farmerId",
  requireAuth,
  authorizeRoles("Farmer", "Retailer"),
  getFarmerById,
);

module.exports = router;
