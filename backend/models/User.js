const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const farmerProfileSchema = new mongoose.Schema(
  {
    farmName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    acreage: {
      type: Number,
      default: null,
      min: 0,
    },
    primaryCrops: {
      type: [String],
      default: [],
    },
    farmingMethod: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    certifications: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },
    preferredContact: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["Farmer", "Retailer"],
      required: true,
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    farmerProfile: {
      type: farmerProfileSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function saveHook() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
