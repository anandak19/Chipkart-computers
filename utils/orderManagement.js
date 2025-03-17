const mongoose = require("mongoose");
const OrderSchema = require("../models/Order");
const Wallet = require("../models/Wallet");
const Users = require("../models/User");
const Order = require("../models/Order");
const WalletTransaction = require("../models/WalletTransaction");
const OrderItem = require("../models/orderItem");

const getOrderItemsDetails = async (orderId) => {
  try {
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

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
    return productDetails;
  } catch (error) {
    throw new Error(`Error fetching order items: ${error.message}`);
  }
};

const creditAmountToUser = async (amount, userId, reason, session = null) => {
  try {
    const user = await Users.findById(userId).session(session);
    if (!user) {
      throw new Error("Error finding user");
    }

    const userWallet = await Wallet.findOne({ userId: user._id }).session(session);
    if (!userWallet) {
      throw new Error("Error finding user's wallet");
    }

    const walletUpdateResult = await Wallet.updateOne(
      { userId: user._id },
      { 
        $inc: {
          totalCredited: amount,
          balanceLeft: amount,
        }
      },
      { session }
    );

    if (!walletUpdateResult.modifiedCount) {
      throw new Error("Error adding amount to wallet");
    }

    // Add transaction entry
    const newWalletTransaction = new WalletTransaction({
      userId: user._id,
      userWalletId: userWallet._id,
      amount,
      transactionType: "credit",
      reason,
    });

    if (session) {
      await newWalletTransaction.save({ session });
    } else {
      await newWalletTransaction.save();
    }

  } catch (error) {
    console.error(error);
    throw new Error("Internal error adding amount to wallet");
  }
};


const cancelOrder = async (orderId, cancelReason) => {
  try {
    const orderDetails = await Order.findById(orderId);
    if (!orderDetails) {
      res.status(404);
      throw new Error(`Order not found`);
    }

    if (orderDetails.orderStatus === "Delivered") {
      res.status(400);
      throw new Error(`Order was already delivered`);
    }

    if (orderDetails.paymentStatus === "Paid") {
      creditAmountToUser(
        orderDetails.totalPayable,
        orderDetails.userId,
        "Order Cancelled"
      );
    }

    orderDetails.isCancelled = true;
    orderDetails.orderStatus = "Cancelled";
    orderDetails.cancelReason = cancelReason;
    await orderDetails.save();

    const modifiedOrderItems = await OrderItem.updateMany(
      { orderId: orderDetails._id },
      { $set: { orderStatus: "Cancelled" } }
    );

    if (modifiedOrderItems.modifiedCount === 0) {
      res.status(400);
      throw new Error(
        "No order items were modified. They may already have the 'Cancelled' status."
      );
    }
  } catch (error) {
    res.status(500);
    throw new Error(`Error cancelling order`);
  }
};

const getFullOrderDetails = async (orderId) => {
  try {
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    const orderDetails = await Order.aggregate([
      {
        $match: { _id: orderObjectId },
      },
      {
        $addFields: {
          addressId: { $toObjectId: "$addressId" },
        },
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
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "orderItems",
        },
      },
    ]);

    const completeOrderDetails = orderDetails[0];
    return completeOrderDetails;
  } catch (error) {
    throw new Error(`Error fetching order details`);
  }
};

const creditReferalReward = async (refUserId, session) => {
  try {
    // find the user with id 
    const refUser = await Users.findById(refUserId).session(session)
    if (!refUser) {
      const error = new Error(`Refered user not found`)
      error.status = 404
      throw error
    }

    await creditAmountToUser(150, refUser.refBy, "Referral Reward", session)
    await creditAmountToUser( 50, refUser._id, "Refered joinee reward", session)

  } catch (error) {
    console.log(error);
    throw new Error(`Error crediting referal reward`);
  }
};

module.exports = {
  getOrderItemsDetails,
  cancelOrder,
  creditAmountToUser,
  getFullOrderDetails,
  creditReferalReward
};
