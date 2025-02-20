const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
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
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

    isReturnRequested: { type: Boolean, default: false },
    returnReason: { type: String, default: 'NA' },
    isReturned: { type: Boolean, default: false },
    returnDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const OrderItem = mongoose.model("OrderItem", OrderItemSchema);

module.exports = OrderItem;
