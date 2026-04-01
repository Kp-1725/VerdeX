const mongoose = require("mongoose");

const chainProofSchema = new mongoose.Schema(
  {
    txHash: {
      type: String,
      required: true,
      trim: true,
    },
    blockNumber: {
      type: Number,
      required: true,
      min: 0,
    },
    chainId: {
      type: Number,
      required: true,
      min: 1,
    },
    contractAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const stageSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedByName: {
      type: String,
      required: true,
    },
    updatedByRole: {
      type: String,
      enum: ["Farmer", "Retailer"],
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    chainProof: {
      type: chainProofSchema,
      required: false,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    farmerSellPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    retailPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    pricingCurrency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    retailPriceUpdatedAt: {
      type: Date,
      default: null,
    },
    qrUrl: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["Farmer", "Retailer"],
      required: true,
    },
    creationProof: {
      type: chainProofSchema,
      required: false,
    },
    stages: [stageSchema],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    archivedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
