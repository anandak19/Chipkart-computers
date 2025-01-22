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
      return res.json({success: false, message: errorMessage})
    }

    if (!req.files || req.files.length !== 4) {
      return res.json({success: false, message: "Minimum 4 images required"})
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
        return res.json({success: false, message: errorMessage})
      }

    return next();
  } catch (error) {
    console.log(error);
    return res.redirect("/admin/products");
  }
};

module.exports = { newProductValidations, updateProductValidations };
