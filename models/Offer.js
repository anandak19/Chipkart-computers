const mongoose = require("mongoose");

const { Schema } = mongoose;

const OfferShema = new Schema(
  {
    offerTitle: { type: String, required: true, trim: true },
    discount: { type: Number, required: true, min: 0 },
    target: { type: String, enum: ["all", "category"], default: "category" },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      default: null,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", OfferShema);

module.exports = Offer;
