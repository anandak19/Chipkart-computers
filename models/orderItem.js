const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productName: { type: String, required: true },
    mrp: { type: Number, required: true },
    discount: { type: Number, required: true, min: 0 },
    image: {
      filename: { type: String, required: true },
      filepath: { type: String, required: true },
      position: { type: Number, required: true },
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    quantity: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    subTotalPrice: { type: Number, required: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    orderStatus: {
      type: String,
      enum: ["Ordered", "Shipped", "Delivered", "Cancelled"],
      default: "Ordered",
      trim: true,
    },

    returnStatus: { type: String, enum:["none", "requested", "approved", "rejected"] , default: "none" },
    returnReason: { type: String, default: "" },
    isReturned: { type: Boolean, default: false },
    returnDate: { type: Date, default: null },

    isReturnRejected: { type: Boolean, default: false },
    returnRejectReason: { type: String, default: "" },
    isRefunded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const OrderItem = mongoose.model("OrderItem", OrderItemSchema);

module.exports = OrderItem;
