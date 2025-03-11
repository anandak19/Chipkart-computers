const mongoose = require("mongoose");
const crypto = require("crypto")

const { Schema } = mongoose;

const UsersSchema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, default:null },
  email: { type: String, required: true, unique: true },
  dob: { type: String, default:null  },
  password: { type: String, default:null },
  otp: { type: String, default:null},
  otpExpires: { type: Date, default:null }, 
  isVerified: { type: Boolean, required: true, default: false  },
  isBlocked: { type: Boolean, required: true, default: false  },
  blockReason: { type: String, default: null  },
  isAdmin: { type: Boolean, required: true, default: false  },
  resetPasswordToken : { type: String, default: null },
  resetPasswordExpires : { type: Date, default: null },

  isFirstOrderDone: { type: Boolean, default: false  },
  refBy:{ type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null},
  referralCode: {type: String, unique: true}
},
{
  timestamps: true,
}
);

UsersSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(10).toString("hex")
  }
  next()
})

const Users = mongoose.model("Users", UsersSchema);

module.exports = Users;
