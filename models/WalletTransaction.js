const mongoose = require("mongoose");

const { Schema } = mongoose;

const WalletTransactionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    userWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    amount: { type: Number, required: true },
    transactionType: {
      type: String,
      enum: ["credit", "debit"], 
      required: true
    }, 
    reason: { 
      type: String,
      enum: ["orderCancel", "itemReturn", "refReward", "walletPay"],
      required: true
    },
    transactionId: {
      type: String,
      unique: true,
      default: () => `TXN-${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
  },
  {
    timestamps: true,
  }
);

const WalletTransaction = mongoose.model("WalletTransaction", WalletTransactionSchema);
module.exports = WalletTransaction;