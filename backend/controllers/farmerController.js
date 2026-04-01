const User = require("../models/User");

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  return [];
}

function containsText(source, target) {
  return String(source || "")
    .toLowerCase()
    .includes(String(target || "").toLowerCase());
}

async function upsertMyFarmerProfile(req, res) {
  try {
    if (req.user.role !== "Farmer") {
      return res
        .status(403)
        .json({ message: "Only farmers can edit profile." });
    }

    const payload =
      req.body?.profile && typeof req.body.profile === "object"
        ? req.body.profile
        : req.body;

    const farmName = String(payload?.farmName || "").trim();
    const location = String(payload?.location || "").trim();
    const acreage =
      payload?.acreage === undefined ||
      payload?.acreage === null ||
      payload?.acreage === ""
        ? null
        : Number(payload.acreage);
    const bio = String(payload?.bio || "").trim();

    if (!farmName) {
      return res.status(400).json({ message: "Farm name is required." });
    }

    if (!location) {
      return res.status(400).json({ message: "Farm location is required." });
    }

    if (acreage !== null && (!Number.isFinite(acreage) || acreage < 0)) {
      return res
        .status(400)
        .json({ message: "Acreage should be a valid value." });
    }

    req.user.farmerProfile = {
      farmName,
      location,
      acreage,
      primaryCrops: normalizeList(payload?.primaryCrops),
      farmingMethod: String(payload?.farmingMethod || "").trim(),
      certifications: normalizeList(payload?.certifications),
      bio,
      phone: String(payload?.phone || "").trim(),
      preferredContact: String(payload?.preferredContact || "").trim(),
    };

    await req.user.save();

    return res.json({
      message: "Farmer profile saved ✅",
      profile: req.user.farmerProfile,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not save farmer profile." });
  }
}

async function listFarmers(req, res) {
  try {
    const cropFilter = String(req.query.crop || "").trim();
    const locationFilter = String(req.query.location || "").trim();
    const methodFilter = String(req.query.method || "").trim();

    const farmers = await User.find({ role: "Farmer" })
      .select("name identifier farmerProfile createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const filtered = farmers.filter((farmer) => {
      const profile = farmer.farmerProfile || {};

      if (cropFilter) {
        const matchesCrop = (profile.primaryCrops || []).some((crop) =>
          containsText(crop, cropFilter),
        );
        if (!matchesCrop) {
          return false;
        }
      }

      if (locationFilter && !containsText(profile.location, locationFilter)) {
        return false;
      }

      if (methodFilter && !containsText(profile.farmingMethod, methodFilter)) {
        return false;
      }

      return true;
    });

    return res.json({ farmers: filtered });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch farmers." });
  }
}

async function getFarmerById(req, res) {
  try {
    const { farmerId } = req.params;

    const farmer = await User.findOne({ _id: farmerId, role: "Farmer" })
      .select("name identifier farmerProfile createdAt")
      .lean();

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    return res.json({ farmer });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch farmer profile." });
  }
}

module.exports = {
  upsertMyFarmerProfile,
  listFarmers,
  getFarmerById,
};
