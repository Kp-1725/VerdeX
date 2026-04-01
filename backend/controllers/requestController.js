const User = require("../models/User");
const TradeRequest = require("../models/TradeRequest");

function parsePositiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} should be a valid positive number.`);
  }

  return Number(parsed.toFixed(2));
}

function isParticipant(request, userId) {
  const id = String(userId || "");
  return String(request.retailer) === id || String(request.farmer) === id;
}

async function createTradeRequest(req, res) {
  try {
    const { farmerId, crop, quantity, unit, offeredPrice, currency, message } =
      req.body;

    if (
      !farmerId ||
      !crop ||
      quantity === undefined ||
      offeredPrice === undefined
    ) {
      return res.status(400).json({ message: "Please fill request details." });
    }

    const farmer = await User.findOne({ _id: farmerId, role: "Farmer" }).select(
      "name",
    );

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    const request = await TradeRequest.create({
      retailer: req.user._id,
      retailerName: req.user.name,
      farmer: farmer._id,
      farmerName: farmer.name,
      crop: String(crop).trim(),
      quantity: parsePositiveNumber(quantity, "Quantity"),
      unit: String(unit || "kg")
        .trim()
        .toUpperCase(),
      offeredPrice: parsePositiveNumber(offeredPrice, "Offered price"),
      currency: String(currency || "INR")
        .trim()
        .toUpperCase(),
      status: "Pending",
      messages: message
        ? [
            {
              sender: req.user._id,
              senderName: req.user.name,
              senderRole: req.user.role,
              text: String(message).trim(),
              sentAt: new Date(),
            },
          ]
        : [],
    });

    return res.status(201).json({
      message: "Request sent to farmer ✅",
      request,
    });
  } catch (error) {
    if (String(error?.message || "").includes("valid positive number")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Could not send request." });
  }
}

async function getMyTradeRequests(req, res) {
  try {
    const query =
      req.user.role === "Farmer"
        ? { farmer: req.user._id }
        : { retailer: req.user._id };

    const requests = await TradeRequest.find(query)
      .sort({ updatedAt: -1 })
      .limit(60)
      .lean();

    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch your requests." });
  }
}

async function updateTradeRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const request = await TradeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (!isParticipant(request, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You do not have access to this request." });
    }

    const normalizedStatus = String(status || "").trim();

    if (req.user.role === "Farmer") {
      if (!["Accepted", "Rejected"].includes(normalizedStatus)) {
        return res
          .status(400)
          .json({ message: "Farmer can accept or reject only." });
      }

      if (request.status !== "Pending") {
        return res
          .status(409)
          .json({ message: "Only pending requests can be updated." });
      }
    }

    if (req.user.role === "Retailer") {
      if (normalizedStatus !== "Closed") {
        return res
          .status(400)
          .json({ message: "Retailer can close request only." });
      }

      if (!["Accepted", "Rejected"].includes(request.status)) {
        return res
          .status(409)
          .json({ message: "Request should be responded by farmer first." });
      }
    }

    request.status = normalizedStatus;
    request.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: `Status changed to ${normalizedStatus}`,
      sentAt: new Date(),
    });

    await request.save();

    return res.json({
      message: `Request ${normalizedStatus.toLowerCase()} ✅`,
      request,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not update request status." });
  }
}

async function addTradeRequestMessage(req, res) {
  try {
    const { requestId } = req.params;
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    const request = await TradeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (!isParticipant(request, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You do not have access to this request." });
    }

    if (request.status === "Closed") {
      return res
        .status(409)
        .json({ message: "Cannot message on a closed request." });
    }

    request.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text,
      sentAt: new Date(),
    });

    await request.save();

    return res.json({ message: "Message sent ✅", request });
  } catch (error) {
    return res.status(500).json({ message: "Could not send message." });
  }
}

module.exports = {
  createTradeRequest,
  getMyTradeRequests,
  updateTradeRequestStatus,
  addTradeRequestMessage,
};
