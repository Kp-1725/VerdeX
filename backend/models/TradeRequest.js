const mongoose = require("mongoose");

const requestMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ["Farmer", "Retailer"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const tradeRequestSchema = new mongoose.Schema(
  {
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    retailerName: {
      type: String,
      required: true,
      trim: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    farmerName: {
      type: String,
      required: true,
      trim: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "kg",
      trim: true,
      uppercase: true,
      maxlength: 16,
    },
    offeredPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Closed"],
      default: "Pending",
      index: true,
    },
    messages: {
      type: [requestMessageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TradeRequest", tradeRequestSchema);
