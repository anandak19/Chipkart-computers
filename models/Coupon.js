const mongoose = require("mongoose");

const { Schema } = mongoose;

const CouponSchema = new Schema(
  {
    couponCode: { type: String, required: true, unique: true, trim: true },
    discount: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, required: true, min: 0 },
    expirationDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    couponStatus: {
      type: String,
      required: true,
      enum: ["active", "expired", "disabled"],
    },
  },
  {
    timestamps: true,
  }
);

const Coupons = mongoose.model("Coupons", CouponSchema);

module.exports = Coupons;
