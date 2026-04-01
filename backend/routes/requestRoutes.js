const express = require("express");
const {
  createTradeRequest,
  getMyTradeRequests,
  updateTradeRequestStatus,
  addTradeRequestMessage,
} = require("../controllers/requestController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", requireAuth, authorizeRoles("Retailer"), createTradeRequest);
router.get(
  "/mine",
  requireAuth,
  authorizeRoles("Farmer", "Retailer"),
  getMyTradeRequests,
);
router.patch(
  "/:requestId/status",
  requireAuth,
  authorizeRoles("Farmer", "Retailer"),
  updateTradeRequestStatus,
);
router.post(
  "/:requestId/messages",
  requireAuth,
  authorizeRoles("Farmer", "Retailer"),
  addTradeRequestMessage,
);

module.exports = router;
