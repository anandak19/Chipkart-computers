const mongoose = require("mongoose");

const { Schema } = mongoose;

const CouponSchema = new Schema(
  {
    couponCode: { type: String, required: true, unique: true, trim: true },
    discount: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: false },
    usedCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

CouponSchema.virtual("isExpired").get(function () {
  return new Date() > this.endDate;
});

const Coupons = mongoose.model("Coupons", CouponSchema);

module.exports = Coupons;
