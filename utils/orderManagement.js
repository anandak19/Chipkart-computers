const mongoose = require("mongoose");
const OrderSchema = require("../models/Order");
const Wallet = require("../models/Wallet");
const Users = require("../models/User");
const Order = require("../models/Order");
const WalletTransaction = require("../models/WalletTransaction");
const OrderItem = require("../models/orderItem");
const CustomError = require("./customError");
const { STATUS_CODES } = require("./constants");

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
      throw new CustomError('User not found', STATUS_CODES.NOT_FOUND);
    }

    const userWallet = await Wallet.findOne({ userId: user._id }).session(session);
    if (!userWallet) {
      throw new CustomError("Error finding user's wallet", STATUS_CODES.NOT_FOUND);
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
      throw new CustomError("Error adding amount to wallet", STATUS_CODES.NOT_FOUND);
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
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Internal error adding amount to wallet", STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

// edated
const cancelOrder = async (orderId, cancelReason) => {
  try {
    console.log("This is the mobile view branch and this route is cancelling the order")
    const orderDetails = await Order.findById(orderId);
    if (!orderDetails) {
      throw new CustomError(`Order not found`, STATUS_CODES.NOT_FOUND)
    }

    if (orderDetails.orderStatus === "Delivered") {
      throw new CustomError(`Order was already delivered`, STATUS_CODES.CONFLICT)
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
      throw new CustomError("No order items were modified. They may already have the 'Cancelled' status.", STATUS_CODES.BAD_REQUEST)
    }
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Error cancelling order', STATUS_CODES.INTERNAL_SERVER_ERROR);
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
    throw new CustomError("Error fetching order details", STATUS_CODES.BAD_REQUEST)
  }
};

const creditReferalReward = async (refUserId, session) => {
  try {
    // find the user with id 
    const refUser = await Users.findById(refUserId).session(session)
    if (!refUser) {
      throw new CustomError(`Refered user not found`, STATUS_CODES.NOT_FOUND);
    }

    await creditAmountToUser(150, refUser.refBy, "Referral Reward", session)
    await creditAmountToUser( 50, refUser._id, "Refered joinee reward", session)

  } catch (error) {

    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(`Error crediting referal reward`, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  getOrderItemsDetails,
  cancelOrder,
  creditAmountToUser,
  getFullOrderDetails,
  creditReferalReward
};
