const CartSchema = require("../models/Cart");
const ProductSchema = require("../models/Product");
const { STATUS_CODES } = require("./constants");
const CustomError = require("./customError");
const { addFinalPriceStage } = require("./productHelpers");

const getUserCartItems = async (userId) => {
  const pipeline = [
    {
      $match: { userId: userId },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        "productDetails.stock": "$productDetails.quantity",
      },
    },
    {
      $project: {
        "productDetails._id": 1,
        "productDetails.productName": 1,
        "productDetails.mrp": 1,
        "productDetails.discount": 1,
        "productDetails.image": {
          $arrayElemAt: ["$productDetails.images", 0],
        }, // Get first image
        "productDetails.offerStartDate": 1,
        "productDetails.offerEndDate": 1,
        "productDetails.stock": 1,
        products: 1,
        userId: 1,
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$productDetails", "$products", "$$ROOT"],
        },
      },
    },
    {
      $project: {
        productDetails: 0,
        products: 0,
        userId: 0,
      },
    },
    addFinalPriceStage,
    // to add stock status and subtotal price
    {
      $addFields: {
        stockStatus: {
          $cond: {
            if: { $eq: ["$stock", 0] },
            then: "out",
            else: {
              $cond: {
                if: { $gt: ["$quantity", "$stock"] },
                then: "sna",
                else: "in",
              },
            },
          },
        },
        subTotalPrice: {
          $multiply: ["$finalPrice", "$quantity"],
        },
      },
    },
  ];

  return await CartSchema.aggregate(pipeline);
};

// need update 
const getCartTotal = async (userId) => {
  const cart = await getUserCartItems(userId);

  const cartSubTotal = cart.reduce((total, item) => {
    return total + (item.subTotalPrice || 0);
  }, 0);

  return cartSubTotal;
};

const checkProductsAvailability = async (cart) => {
  return await Promise.all(
    cart.products.map(async (item) => {
      const product = await ProductSchema.findById(item.productId);

      if (!product) {
        throw new CustomError( `Product with ID ${item.productId} not found`, STATUS_CODES.NOT_FOUND);
      }

      if (!product.isListed) {
        throw new CustomError( `"${product.productName}" is not available`, STATUS_CODES.FORBIDDEN);
      }

      if (product.quantity === 0) {
        throw new CustomError(`"${product.productName}" is out of stock!. Try again after removing it from cart`, STATUS_CODES.CONFLICT);
      }

      if (item.quantity > product.quantity) {
        throw new CustomError(`Requsted quantity for the product "${product.productName}" is not available. Try again after decreesing the quantity`, STATUS_CODES.CONFLICT);
      }

      return product;
    })
  );
};

module.exports = { getUserCartItems, getCartTotal, checkProductsAvailability };
