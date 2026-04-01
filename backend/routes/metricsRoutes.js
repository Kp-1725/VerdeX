const express = require("express");
const { getPlatformMetrics } = require("../controllers/metricsController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/overview",
  requireAuth,
  authorizeRoles("Farmer", "Retailer"),
  getPlatformMetrics,
);

module.exports = router;
