const { mongoose } = require("mongoose");
const Users = require("../models/User");
const Wallet = require("../models/Wallet");

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
      console.log("referer", referrer)
      if (!referrer) {
        throw new Error("Invalid Referral Link");
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
      throw new Error("Faild to save new user");
    }

    const newUserWallet = new Wallet({ userId: savedUser._id });

    const userWallet = await newUserWallet.save({ session });
    if (!userWallet) {
      await session.abortTransaction();
      throw new Error("Faild to create user wallet");
    }

    await session.commitTransaction();

    return savedUser

  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    throw new Error("Error creating new user");
  } finally {
    session.endSession();
  }
};

module.exports = { createNewUser };
