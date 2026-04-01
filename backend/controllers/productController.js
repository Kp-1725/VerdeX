const Product = require("../models/Product");

async function createProduct(req, res) {
  try {
    const { productId, name } = req.body;

    if (!productId || !name) {
      return res.status(400).json({ message: "Please enter product details." });
    }

    const parsedId = Number(productId);
    if (Number.isNaN(parsedId)) {
      return res
        .status(400)
        .json({ message: "Product ID should be a number." });
    }

    const exists = await Product.findOne({ productId: parsedId });
    if (exists) {
      return res.status(409).json({ message: "Product ID already exists." });
    }

    const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
    const qrUrl = `${publicAppUrl}/product/${parsedId}`;

    const product = await Product.create({
      productId: parsedId,
      name: String(name).trim(),
      qrUrl,
      createdBy: req.user._id,
      createdByName: req.user.name,
      createdByRole: req.user.role,
      stages: [],
    });

    return res.status(201).json({
      message: "Saved Successfully ✅",
      product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not save product. Please try again." });
  }
}

async function addStageMetadata(req, res) {
  try {
    const { productId } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ message: "Please choose a status." });
    }

    const parsedId = Number(productId);
    const product = await Product.findOne({ productId: parsedId });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.stages.push({
      stage: String(stage),
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedByRole: req.user.role,
      updatedAt: new Date(),
    });

    await product.save();

    return res.json({
      message: "Updated ✅",
      product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not update status. Please try again." });
  }
}

async function getProductMetadata(req, res) {
  try {
    const parsedId = Number(req.params.productId);
    const product = await Product.findOne({ productId: parsedId });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json({ product });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not fetch product details." });
  }
}

async function getMyProducts(req, res) {
  try {
    const products = await Product.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(25)
      .select("productId name createdAt");

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch your products." });
  }
}

async function deleteMyProduct(req, res) {
  try {
    const parsedId = Number(req.params.productId);
    if (Number.isNaN(parsedId)) {
      return res
        .status(400)
        .json({ message: "Product ID should be a number." });
    }

    const deletedProduct = await Product.findOneAndDelete({
      productId: parsedId,
      createdBy: req.user._id,
    });

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ message: "Product not found in your list." });
    }

    return res.json({ message: "Deleted ✅" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not delete product. Please try again." });
  }
}

module.exports = {
  createProduct,
  addStageMetadata,
  getProductMetadata,
  getMyProducts,
  deleteMyProduct,
};
