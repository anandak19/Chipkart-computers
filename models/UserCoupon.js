const mongoose = require("mongoose");

const { Schema } = mongoose;

const UserCouponSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    couponCode: { type: String, required: true },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
  },
  { timestamps: true }
);

const UserCoupon = mongoose.model("UserCoupon", UserCouponSchema);

module.exports = UserCoupon;
