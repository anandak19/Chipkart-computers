const Product = require("../models/Product");
const { STATUS_CODES } = require("./constants");
const CustomError = require("./customError");

const getProductWithFinalPrice = async (productId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new CustomError( "Product not found", STATUS_CODES.NOT_FOUND);
    }

    const today = new Date();

    if (
      product.offerStartDate instanceof Date &&
      product.offerEndDate instanceof Date
    ) {
      if (product.offerStartDate <= today && product.offerEndDate >= today) {
        product.finalPrice = Math.floor(
          product.mrp - product.mrp * (product.discount / 100)
        );
      } else {
        product.finalPrice = product.mrp;
      }
    } else {
      product.finalPrice = product.mrp;
    }

    return product;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Error calculating final price of product', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

const addFinalPriceStage = {
  $addFields: {
    finalPrice: {
      $floor: {
        $subtract: [
          "$mrp",
          {
            $cond: {
              if: {
                $and: [
                  { $lte: ["$offerStartDate", new Date()] },
                  { $gte: ["$offerEndDate", new Date()] },
                ],
              },
              then: { $multiply: ["$mrp", { $divide: ["$discount", 100] }] },
              else: 0,
            },
          },
        ],
      },
    },
  },
};

module.exports = { getProductWithFinalPrice, addFinalPriceStage };
