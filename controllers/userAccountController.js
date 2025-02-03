const UserSchema = require("../models/User");
const bcrypt = require('bcrypt')
const logoutUser = require("../utils/logoutUser");
const {
  validateDob,
  validateName,
  validatePhoneNumber,
  validateEmail,
  validatePassword,
} = require("../utils/validations");

// make a session validate middleware later that sends json response

// PERSONAL DETAILS
// render personal details page
exports.getAccount = (req, res) => {
  res.render("user/account/userAccount", { currentPage: "account" });
};

// get users details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dob: user.dob,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// post updated users details
exports.postUserDetails = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await UserSchema.findById(userId);
    console.log("user id: ", userId);
    console.log("Requested body: ", req.body);
    console.log("requested user :", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let { name, email, phoneNumber, dob } = req.body;
    if (!name || !email || !phoneNumber || !dob) {
      return res.status(400).json({ error: "All fields are required" });
    }

    name = name.trim();
    email = email.trim();
    phoneNumber = phoneNumber.trim();
    dob = dob.trim();

    let errorMessage = validateName(name) || validateDob(dob);
    if (errorMessage) {
      console.log("Error in name or dob: ", errorMessage);
      return res.status(400).json({ error: errorMessage });
    }

    let refresh = false;

    if (user.email !== email) {
      errorMessage = await validateEmail(email);
      if (errorMessage) {
        console.log("Error in email: ", errorMessage);
        return res.status(400).json({ error: errorMessage });
      }
      refresh = true;
    }

    if (user.phoneNumber !== phoneNumber) {
      errorMessage = await validatePhoneNumber(phoneNumber);
      if (errorMessage) {
        console.log("Error in phone: ", errorMessage);
        return res.status(400).json({ error: errorMessage });
      }
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.dob = dob;

    await user.save();
    console.log(user);

    req.session.user = {
      email: user.email,
      id: user._id,
      name: user.name,
    };

    if (refresh) {
      await logoutUser(req, res);
    }

    return res
      .status(200)
      .json({ message: "User details updated successfully", refresh });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postChangePassword = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const {oldPassword, newPassword, confirmPassword} = req.body
    console.log("REq body: ", req.body)
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect." });
    }

    const errorMessage = validatePassword(newPassword, confirmPassword)

    if (errorMessage) {
      return res.status(400).json({ error: errorMessage });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    await logoutUser(req, res);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
// ------------------------------------

// DELIVERY ADDRESS
exports.getAddresses = (req, res) => {
  res.render("user/account/userAddress", { currentPage: "address" });
};

// ORDER HISTORY
exports.getOrderHistory = (req, res) => {
  res.render("user/account/orderHistory", { currentPage: "orders" });
};

// WALLET
exports.getWallet = (req, res) => {
  res.render("user/account/wallet", { currentPage: "wallet" });
};

// COUPONS
exports.getCoupons = (req, res) => {
  res.render("user/account/coupons", { currentPage: "coupons" });
};

/*
--controllers i will have here

to get users personal detail page
to post the updated personal details
to post the new password

to get the delivery address's page
to delete a address
to get the edit a address page
to post the updated address
to get the add new address page
to post the new address
to make a address as default

to get the wallet page with details
to get the page to view the available coupens

to view the wishlist page
to remove a product from wishlist

*/
