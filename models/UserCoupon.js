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
    orderId: { type: String, required: true },
    isRedeemed: { type: Boolean, default: false },
    isCredited: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const UserCoupon = mongoose.model("UserCoupon", UserCouponSchema);

module.exports = UserCoupon;
