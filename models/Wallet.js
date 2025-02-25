const mongoose = require("mongoose");

const { Schema } = mongoose;

const WalletSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true,
    },
    totalCredited: { 
      type: Number, 
      default: 0 
    }, 
    balanceLeft: { 
      type: Number, 
      default: 0 
    }, 
    isActive: { 
      type: Boolean, 
      default: true 
    }, 
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", WalletSchema); 
module.exports = Wallet;
