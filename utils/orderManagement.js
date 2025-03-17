const mongoose = require("mongoose");
const OrderSchema = require("../models/Order");
const Wallet = require("../models/Wallet");
const Users = require("../models/User");
const Order = require("../models/Order");
const WalletTransaction = require("../models/WalletTransaction");
const OrderItem = require("../models/orderItem");

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


const refundUserAmount = async(amount, userId, reason) => {
  try {
    const user = await Users.findById(userId)
    if(!user) {
      throw new Error('Error finding user')
    }

    const userWallet = await Wallet.findOne({userId: user._id})

    if (!userWallet) {
      throw new Error('Error finding users wallet')
    }

    userWallet.totalCredited += amount
    userWallet.balanceLeft += amount

    const updatedWallet = await userWallet.save()

    if (!updatedWallet) {
      throw new Error("Error adding amount to wallet")
    }

    // update to trasactions 
    const newWalletTransaction = new WalletTransaction({
      userId: user._id,
      userWalletId: userWallet._id,
      amount,
      transactionType: 'credit',
      reason,
    })

    await newWalletTransaction.save()
    
  } catch (error) {
    throw new Error('Internal error adding amount to wallet')
  }
}

const cancelOrder = async (orderId, cancelReason) => {
  try {
    const orderDetails = await Order.findById(orderId);
    if (!orderDetails) {
      res.status(404);
      throw new Error(`Order not found`);
    }

    if (orderDetails.orderStatus === 'Delivered') {
      res.status(400);
      throw new Error(`Order was already delivered`);
    }

    if (orderDetails.paymentStatus === 'Paid') {
      refundUserAmount(orderDetails.totalPayable, orderDetails.userId, 'orderCancel')
    }

    orderDetails.isCancelled = true;
    orderDetails.orderStatus = "Cancelled";
    orderDetails.cancelReason = cancelReason;
    await orderDetails.save();

    const modifiedOrderItems = await OrderItem.updateMany(
      { orderId: orderDetails._id }, 
      { $set: { orderStatus: "Cancelled" } }
    )

    if (modifiedOrderItems.modifiedCount === 0) {
      res.status(400);
      throw new Error("No order items were modified. They may already have the 'Cancelled' status.");
    }
    
  } catch (error) {
    res.status(500);
    throw new Error(`Error cancelling order`);
  }
}

const getFullOrderDetails = async (orderId) => {
  try {
    const orderObjectId = new mongoose.Types.ObjectId(orderId)

    const orderDetails = await Order.aggregate([
      {
        $match: { _id: orderObjectId },
      },
      {
        $addFields: {
          addressId: {$toObjectId: "$addressId"}
        }
      },
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "shippingAddress",
        },
      },
      {
        $unwind: "$shippingAddress",
      },
      {
        $lookup: {
          from: 'orderitems',
          localField: '_id',
          foreignField: 'orderId',
          as: 'orderItems'
        }
      }
    ])

    const completeOrderDetails = orderDetails[0]
    return completeOrderDetails
    
  } catch (error) {
    throw new Error(`Error fetching order details`);
  }
}


module.exports = { getOrderItemsDetails, cancelOrder, refundUserAmount, getFullOrderDetails };