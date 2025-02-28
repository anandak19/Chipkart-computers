const mongoose = require("mongoose");

const { Schema } = mongoose;

const WishlistItemsSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const WishlistItems = mongoose.model("WishlistItems", WishlistItemsSchema);
module.exports = WishlistItems;
