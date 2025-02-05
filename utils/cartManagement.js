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
              "products.subTotalPrice": {
                $multiply: ["$productDetails.finalPrice", "$products.quantity"]
              }
            },
          }
    ])
}

module.exports = {getUserCartItems}