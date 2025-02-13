const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    subTotalPrice: { type: Number, required: true },
    image: { type: Array, default: [] },
    isReturnRequested: { type: Boolean, default: false },
    returnReason: { type: String, default: 'NA' },
    isReturned: { type: Boolean, default: false },
    returnDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const OrderItem = mongoose.model("OrderItem", OrderItemSchema);

module.exports = OrderItem;
