const {
  validateNewProductName,
  validateCategory,
  validateBrand,
  validateFinalPrice,
  validateQuantity,
  validateHiglights,
  validateDescription,
  validateProductName,
} = require("../utils/productValidators");
const ProductSchema = require("../models/Product");
const CartSchema = require("../models/Cart");

const newProductValidations = async (req, res, next) => {
  try {
    const { productName, categoryId, brand, description } = req.body;
    const mrp = parseFloat(req.body.mrp);
    const discount = parseFloat(req.body.discount);
    const finalPrice = parseFloat(req.body.finalPrice);
    const quantity = parseFloat(req.body.quantity);
    const highlights = JSON.parse(req.body.highlights);

    // calling validations
    const errorMessage =
      (await validateNewProductName(productName)) ||
      (await validateCategory(categoryId)) ||
      validateBrand(brand) ||
      validateFinalPrice(mrp, discount, finalPrice) ||
      validateQuantity(quantity) ||
      validateHiglights(highlights) ||
      validateDescription(description);

    if (errorMessage) {
      return res.json({ success: false, message: errorMessage });
    }

    if (!req.files || req.files.length !== 4) {
      return res.json({ success: false, message: "Minimum 4 images required" });
    }
    return next();
  } catch (error) {
    console.log(error);
    return res.redirect("/admin/products");
  }
};

const updateProductValidations = async (req, res, next) => {
  try {
    const { productName, categoryId, brand, description } = req.body;
    const mrp = parseFloat(req.body.mrp);
    const discount = parseFloat(req.body.discount);
    const finalPrice = parseFloat(req.body.finalPrice);
    const quantity = parseFloat(req.body.quantity);
    const highlights = JSON.parse(req.body.highlights);

    // calling validations
    const errorMessage =
      (await validateProductName(productName)) ||
      (await validateCategory(categoryId)) ||
      validateBrand(brand) ||
      validateFinalPrice(mrp, discount, finalPrice) ||
      validateQuantity(quantity) ||
      validateHiglights(highlights) ||
      validateDescription(description);

    if (errorMessage) {
      return res.json({ success: false, message: errorMessage });
    }

    return next();
  } catch (error) {
    console.log(error);
    return res.redirect("/admin/products");
  }
};

// validate product and send json res , if validated product id is avail in req.productId
// check if the product is present, check if the product is in db,
const validateProduct = async (req, res, next) => {
  try {
    console.log("body", req.body);
    const productId = req.params.id;
    if (!productId) {
      console.log("Id not found");
      return res.status(404).send("Id not found");
    }
    const product = await ProductSchema.findById(productId);
    if (!product) {
      console.log("Product not found");
      return res.status(404).send("Product not found");
    }
    console.log("Product validatation passed");
    req.productId = product._id;
    return next();
  } catch (error) {
    console.log(error);
  }
};

const checkProductAvailability = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res
        .status(400)
        .json({ error: "Product not found in request! Select one product" });
    }

    const product = await ProductSchema.findById(productId);
    if (!product) {
      console.log("Product not found");
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.isListed) {
      return res
        .status(403)
        .json({ error: "Product not available at this moment" });
    }

    if (product.quantity <= 0) {
      return res.status(410).json({ error: "Product became out of stock" });
    }

    req.product = product;

    return next();
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

module.exports = {
  newProductValidations,
  updateProductValidations,
  validateProduct,
  checkProductAvailability,
};
