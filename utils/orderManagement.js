const mongoose = require("mongoose");
const OrderSchema = require("../models/Order");

const getOrderItemsDetails = async(orderId) => {
  try {

    const orderObjectId = new mongoose.Types.ObjectId(orderId)

    const pipeline = [
      {
        $match: { _id: orderObjectId },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 0,
          productId: "$items.productId",
          quantity: "$items.quantity",
          name: "$productDetails.productName",
          price: "$productDetails.finalPrice",
          images: "$productDetails.images",
        },
      },
    ];

    const productDetails = await OrderSchema.aggregate(pipeline);
    return productDetails
  } catch (error) {
    throw new Error(`Error fetching order items: ${error.message}`);
  }
};

module.exports = { getOrderItemsDetails };