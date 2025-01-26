const mongoose = require("mongoose");

const { Schema } = mongoose;

const UserReviewsSchema = new Schema(
  {
    ProductId: { type: String, required: true },
    UserId: { type: String, required: true },
    ReviewText: { type: String, default: null },
    Rating: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const UserReviews = mongoose.model("UserReviews", UserReviewsSchema);

module.exports = UserReviews;