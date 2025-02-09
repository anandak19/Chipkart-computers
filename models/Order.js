const mongoose = require("mongoose");

const { Schema } = mongoose;


const CartProductSchema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: [{ type: mongoose.Schema.Types.Mixed }],
  subTotalPrice: { type: Number, required: true }
});

const OrderSchema = new Schema(
  {
    orderId: {type: String, unique: true },
    userId: {type: String, ref: "User", required: true},
    addressId: {type: String, ref: "Address", required: true},
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
    paymentStatus: {type: String, required: true, enum: ["Pending", "Success", "Faild"], default: "Pending", trim: true },
    razorpayPaymentId: { type: String, default: null },
    paymentMethod: {type: String, required: true, enum: ["COD", "Online"], trim: true },
    appliedCoupon: { type: String, default: null },
    orderStatus: {type: String, enum: ["Ordered", "Shipped", "Delivered", "Cancelled"], default: "Ordered", trim: true },
    isCancelled: { type: Boolean, default: false },
    cancelReason: { type: String, default: null },
    items: [{ type: mongoose.Schema.Types.Mixed }],
    
  },
  { timestamps: true }
);

OrderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }
  next()
})



const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
