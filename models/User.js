const mongoose = require("mongoose");

const { Schema } = mongoose;

const UsersSchema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, unique: true, default:null },
  email: { type: String, required: true, unique: true },
  password: { type: String, default:null },
  otp: { type: String, default:null},
  otpExpires: { type: Date, default:null }, 
  isVerified: { type: Boolean, required: true, default: false  },
  isBlocked: { type: Boolean, required: true, default: false  },
  blockReason: { type: String, default: null  },
  isAdmin: { type: Boolean, required: true, default: false  },
  resetPasswordToken : { type: String, default: null },
  resetPasswordExpires : { type: Date, default: null },
},
{
  timestamps: true,
}
);

const Users = mongoose.model("Users", UsersSchema);

module.exports = Users;
