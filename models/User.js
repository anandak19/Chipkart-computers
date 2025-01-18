const mongoose = require("mongoose");

const { Schema } = mongoose;

const UsersSchema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, unique: true , default:null},
  otpExpires: { type: Date, default:null }, 
  isVerified: { type: Boolean, required: true, default: false  },
  isBlocked: { type: Boolean, required: true, default: false  },
  isAdmin: { type: Boolean, required: true, default: false  },
},
{
  timestamps: true,
}
);

const Users = mongoose.model("Users", UsersSchema);

module.exports = Users;
