const mongoose = require("mongoose");

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
    stages: [stageSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
