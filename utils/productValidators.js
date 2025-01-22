const ProductSchema = require("../models/Product");
const CategoriesSchema = require("../models/Category");

/*
to check the product with same name exists /
to check the entered category exists, using its id /
to calculate final price using mrp and  discount /
to check it the stock count is negative /
to check if the higlights have minimum of 3 /
to check if the product discription has minimum 15 charectors
*/

const validateNewProductName = async (productName) => {
  if (!productName || productName.length < 2 || productName > 30) {
    return "Product name must be between 2 and 30 characters long";
  }
  try {
    const existingProduct = await ProductSchema.findOne({ productName });
    if (existingProduct) {
      return "A product with same name exists, please try another name";
    }
    return null;
  } catch (error) {
    console.log(error);
    return "An error occurred while validating the product name";
  }
};

const validateProductName = async (productName) => {
  if (!productName || productName.length < 2 || productName > 30) {
    return "Product name must be between 2 and 30 characters long";
  }
  try {
    const productCount = await ProductSchema.countDocuments({ productName });
    if (productCount > 1) {
      return "A product with same name exists, please try another name";
    }
    return null;
  } catch (error) {
    console.log(error);
    return "An error occurred while validating the product name";
  }
};

const validateCategory = async (categoryId) => {
  try {
    if (!categoryId) {
      return "Missing category!";
    }
    const existingCategory = await CategoriesSchema.findById(categoryId);
    if (!existingCategory) {
      return "Category not found";
    }
    return null;
  } catch (error) {
    console.log(error);
    return "An error occurred while validating the category";
  }
};

const validateBrand = (brand) => {
    console.log(brand)
    if (!brand || brand.length < 2) {
        return 'Invalid brand name'
    }
    return null
}

const validateFinalPrice = (mrp, discount, finalPrice) => {
  if (
    mrp < 0 ||
    discount < 0 ||
    discount > 100 ||
    finalPrice > mrp ||
    isNaN(mrp) ||
    isNaN(discount) ||
    isNaN(finalPrice)
  ) {
    return "Invalid MRP, discount, or final price";
  }
  const discountAmount = (mrp * discount) / 100;
  const discountedPrice = mrp - discountAmount;
  const expectedFinalPrice = Math.ceil(discountedPrice);

  if (expectedFinalPrice !== finalPrice) {
    return "Invalid final price";
  }

  return null;
};

const validateQuantity = (quantity) => {
  if (!quantity || isNaN(quantity) || quantity < 0) {
    return "Invalid quantity";
  }
  return null;
};

const validateHiglights = (higlights) => {
  if (!higlights || higlights.length < 3) {
    return "Minimum 3 higlights required";
  }
  return null;
};

const validateDescription = (description) => {
  if (!description || description.length < 15) {
    return "Description is too short. Minimum 15 characters are required.";
  }
  return null;
};



module.exports = {
    validateNewProductName,
    validateProductName,
    validateCategory,
    validateBrand,
    validateFinalPrice,
    validateQuantity,
    validateHiglights,
    validateDescription
  };
