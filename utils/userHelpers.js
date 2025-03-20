const { mongoose } = require("mongoose");
const Users = require("../models/User");
const Wallet = require("../models/Wallet");
const CustomError = require("./customError");
const { STATUS_CODES } = require("./constants");

const createNewUser = async (
  name,
  email,
  phoneNumber = null,
  password = null,
  isVerified = false,
  referralCode = null
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

    let referrer
    if (referralCode) {
      referrer = await Users.findOne({ referralCode });
      if (!referrer) {
        throw new CustomError("Invalid Referral Link", STATUS_CODES.BAD_REQUEST);
      }
    }

    const newUser = new Users({
      name,
      phoneNumber,
      email,
      password,
      isVerified,
      refBy: referrer ? referrer._id : null 
    });
    const savedUser = await newUser.save({ session });

    if (!savedUser) {
      await session.abortTransaction();
      throw new CustomError("Faild to save new user", STATUS_CODES.BAD_REQUEST);
    }

    const newUserWallet = new Wallet({ userId: savedUser._id });

    const userWallet = await newUserWallet.save({ session });
    if (!userWallet) {
      await session.abortTransaction();
      throw new CustomError("Faild to create user wallet", STATUS_CODES.BAD_REQUEST);
    }

    await session.commitTransaction();
    return savedUser

  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Error creating new user", 500);
  } finally {
    session.endSession();
  }
};

module.exports = { createNewUser };
