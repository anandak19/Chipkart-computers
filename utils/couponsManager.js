const { mongoose } = require("mongoose");
const Coupons = require("../models/Coupon");
const Order = require("../models/Order");
const UserCoupon = require("../models/UserCoupon");

const addUserCoupon = async (orderId, session) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus !== "Paid") {
      throw new Error("Payment did't completed");
    }

    const totalPayable = order.totalPayable;
    const userId = order.userId;

    // user coupons
    const userCoupon = await UserCoupon.find({ userId }).session(session);
    
    // couponid couponCode
    const availableCoupons = await Coupons.aggregate([
      {
        $match: {
          isActive: true,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          minOrderAmount: { $lte: totalPayable },
        },
      },
    ], {session});

    const unusedCoupon = availableCoupons.find(
      (coupon) =>
        !userCoupon.some((used) => used.coupon.couponCode === coupon.couponCode)
    );

    if (!unusedCoupon) {
      return null;
    }
    
    const newCoupon = new UserCoupon({
      userId: new mongoose.Types.ObjectId(userId),
      couponCode: unusedCoupon.couponCode,
    });

    await newCoupon.save({session});

    return unusedCoupon.discount;
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    throw error;
  }
};

module.exports = { addUserCoupon };