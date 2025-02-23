const CartSchema = require("../models/Cart");
const ProductSchema = require("../models/Product");
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

  let shippingFee = 0;
  let cartTotal = 0;

  if (cartSubTotal > 0) {
    shippingFee = cartSubTotal < 5000 ? 100 : 0;
    cartTotal = cartSubTotal + shippingFee;
  }

  return cartTotal;
};

const checkProductsAvailability = async (cart) => {
  return await Promise.all(
    cart.products.map(async (item) => {
      const product = await ProductSchema.findById(item.productId);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      console.log(item);

      if (!product.isListed) {
        throw new Error(`"${product.productName}" is not available`);
      }

      if (product.quantity === 0) {
        throw new Error(
          `"${product.productName}" is out of stock!. Try again after removing it from cart`
        );
      }

      if (item.quantity > product.quantity) {
        throw new Error(
          `Requsted quantity for the product "${product.productName}" is not available. Try again after decreesing the quantity`
        );
      }

      return product;
    })
  );
};

module.exports = { getUserCartItems, getCartTotal, checkProductsAvailability };
