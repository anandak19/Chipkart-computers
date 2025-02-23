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

    const totalPayable = order.totalPayable;
    const userId = order.userId;

    // user coupons
    const userCoupon =
      (await UserCoupon.find({ userId }).session(session)) ?? [];
    console.log("User coupon", userCoupon);

    // couponid couponCode
    const now = new Date();
    now.setMilliseconds(0);

    const availableCoupons = await Coupons.aggregate(
      [
        {
          $match: {
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            minOrderAmount: { $lte: totalPayable },
          },
        },
        {
          $sort: { discount: 1 },
        },
      ],
      { session }
    );

    console.log("Avail coupon", availableCoupons);

    // if the user has coupon call this
    let unusedCoupon = null;

    if (userCoupon.length > 0) {
      unusedCoupon = availableCoupons.find(
        (coupon) =>
          !userCoupon.some(
            (used) => used.couponCode === coupon.couponCode
          )
      );
    } else {
      unusedCoupon = availableCoupons[0] || null;
    }
    
    if (unusedCoupon) {
      const newCoupon = new UserCoupon({
        userId: new mongoose.Types.ObjectId(userId),
        couponCode: unusedCoupon.couponCode,
        orderId: orderId
      });
      await newCoupon.save({ session });
    }


    return unusedCoupon?.discount ?? null;
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    throw error;
  }
};

module.exports = { addUserCoupon };
