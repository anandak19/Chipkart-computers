const mongoose = require("mongoose");

const { Schema } = mongoose;

const AddressSchema = new Schema(
  {
    userId: {type: String, ref: "User", required: true},
    addressType: {
      type: String,
      required: true,
      enum: ["Home", "Work", "Other"],
      trim: true,
    },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", AddressSchema);

module.exports = Address;
