const mongoose = require("mongoose");

const { Schema } = mongoose;

const UserReviewsSchema = new Schema(
  {
    productId: { type: String, required: true },
    userId: { type: String, required: true },
    review: { type: String, default: null },
    rating: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const UserReviews = mongoose.model("UserReviews", UserReviewsSchema);
module.exports = UserReviews;