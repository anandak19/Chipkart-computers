const { mongoose } = require("mongoose");
const Coupons = require("../models/Coupon");
const Order = require("../models/Order");
const UserCoupon = require("../models/UserCoupon");
const CustomError = require("./customError");
const { STATUS_CODES } = require("./constants");

const addUserCoupon = async (orderId, session) => {
  try {
    if (!orderId) {
      throw new CustomError(
        "Order details is required for reward crediting",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new CustomError("Order not found", STATUS_CODES.NOT_FOUND);
    }

    const totalPayable = order.totalPayable;
    const userId = order.userId;

    // user coupons
    const userCoupon =
      (await UserCoupon.find({ userId }).session(session)) ?? [];

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

    // if the user has coupon call this
    let unusedCoupon = null;

    if (userCoupon.length > 0) {
      unusedCoupon = availableCoupons.find(
        (coupon) =>
          !userCoupon.some((used) => used.couponCode === coupon.couponCode)
      );
    } else {
      unusedCoupon = availableCoupons[0] || null;
    }

    if (unusedCoupon) {
      const newCoupon = new UserCoupon({
        userId: userId,
        couponCode: unusedCoupon.couponCode,
        orderId: orderId,
      });
      await newCoupon.save({ session });
    }

    return unusedCoupon?.discount ?? null;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(
      "Error fetching categories",
      STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = { addUserCoupon };
