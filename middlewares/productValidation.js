const {
  validateNewProductName,
  validateCategory,
  validateBrand,
  validateFinalPrice,
  validateQuantity,
  validateHiglights,
  validateDescription,
  validateProductName,
  validateMrp,
} = require("../utils/productValidators");
const ProductSchema = require("../models/Product");
const CartSchema = require("../models/Cart");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");

const newProductValidations = async (req, res, next) => {
  try {
    const { productName, categoryId, brand, description } = req.body;
    const mrp = parseFloat(req.body.mrp);
    const quantity = parseFloat(req.body.quantity);
    const highlights = JSON.parse(req.body.highlights);

    // calling validations
    const errorMessage =
      (await validateNewProductName(productName)) ||
      (await validateCategory(categoryId)) ||
      validateBrand(brand) ||
      validateMrp(mrp) ||
      validateQuantity(quantity) ||
      validateHiglights(highlights) ||
      validateDescription(description);

    if (errorMessage) {
      throw new CustomError( errorMessage, STATUS_CODES.BAD_REQUEST);
    }

    if (!req.files || req.files.length !== 4) {
      throw new CustomError( "Minimum 4 images required", STATUS_CODES.BAD_REQUEST);
    }
    return next();
  } catch (error) {
    next(error)
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
      throw new CustomError( errorMessage, STATUS_CODES.BAD_REQUEST);
    }

    return next();
  } catch (error) {
    next(error)
  }
};

// validate product and send json res , if validated product id is avail in req.productId
// check if the product is present, check if the product is in db,
const validateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      throw new CustomError( "product details not found", STATUS_CODES.NOT_FOUND);
    }
    const product = await ProductSchema.findById(productId);
    if (!product) {
      throw new CustomError( "Product not found", STATUS_CODES.NOT_FOUND);
    }
    req.productId = product._id;
    return next();
  } catch (error) {
    next(error)
  }
};

const checkProductAvailability = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      throw new CustomError( "Product not found in request! Select one product" , STATUS_CODES.BAD_REQUEST);
    }

    const product = await ProductSchema.findById(productId);
    if (!product) {
      throw new CustomError( "Product not found", STATUS_CODES.NOT_FOUND);
    }

    if (!product.isListed) {
      throw new CustomError( "Product not available at this moment", STATUS_CODES.FORBIDDEN);
    }

    if (product.quantity <= 0) {
      throw new CustomError( "Product became out of stock", STATUS_CODES.CONFLICT);
    }

    req.product = product;

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  newProductValidations,
  updateProductValidations,
  validateProduct,
  checkProductAvailability,
};
