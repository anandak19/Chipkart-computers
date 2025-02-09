const CartSchema = require('../models/Cart')

const getUserCartItems = async(userId) => {
    return await CartSchema.aggregate([
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
            $project: {
              _id: 1,
              userId: 1,
              "products.productId": 1,
              "products.quantity": 1,
              "products.name": "$productDetails.productName",
              "products.price": "$productDetails.finalPrice",
              "products.image": "$productDetails.images",
              "products.subTotalPrice": {
                $multiply: ["$productDetails.finalPrice", "$products.quantity"]
              }
            },
          }
    ])
}

const getCartTotal = async(userId) => {
  const cart = await getUserCartItems(userId)

  const cartSubTotal = cart.reduce((total, item) => {
    return total + (item.products.subTotalPrice || 0);
  }, 0);

  let shippingFee = 0;
  let cartTotal = 0;

  if (cartSubTotal > 0) {
    shippingFee = cartSubTotal < 5000 ? 100 : 0;
    cartTotal = cartSubTotal + shippingFee;
  }

  return cartTotal
}

module.exports = {getUserCartItems, getCartTotal}