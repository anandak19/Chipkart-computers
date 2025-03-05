const mongoose = require("mongoose");

const { Schema } = mongoose;

const OfferShema = new Schema(
  {
    offerTitle: { type: String, required: true, trim: true },
    discount: { type: Number, required: true, min: 0 },
    offerTarget: { type: String, enum: ["product", "category"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", OfferShema);

module.exports = Offer;
