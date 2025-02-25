const { mongoose } = require("mongoose");
const Users = require("../models/User");
const Wallet = require("../models/Wallet");

const createNewUser = async (
  name,
  email,
  phoneNumber = null,
  password = null,
  isVerified = false
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newUser = new Users({
      name,
      phoneNumber,
      email,
      password,
      isVerified,
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
