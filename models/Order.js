const mongoose = require("mongoose");

const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    orderId: { type: String, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addressId: { type: String, ref: "Address", required: true },
    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Paid", "Faild"],
      default: "Pending",
      trim: true,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "Online"],
      trim: true,
    },

    razorpayPaymentId: { type: String, required: false },
    razorpayOrderId: { type: String, required: false },
    razorpayPaymentMethod: { type: String, required: false },
    appliedCoupon: { type: String, default: null },
    orderStatus: {
      type: String,
      enum: [ "Pending", "Ordered", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      trim: true,
    },

    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: null },
    deliveryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

OrderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  if (!this.deliveryDate) {
    this.deliveryDate = new Date();
    this.deliveryDate.setDate(this.deliveryDate.getDate() + 5);
  }
  next();
});

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
