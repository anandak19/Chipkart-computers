const UserSchema = require("../models/User");
const bcrypt = require('bcrypt');
const {
  validateName,
  validatePhoneNumber,
  validateEmail,
  validatePassword,
} = require("../utils/validations");
const { createNewUser } = require("../utils/userHelpers");

const signupValidations = async (req, res, next) => {
  try {
    let { name, phoneNumber, email, password, confirmPassword } = req.body;

    // validate each entered input data 
    const alertMessage =
      (validateName(name)) ||
      (await validatePhoneNumber(phoneNumber)) ||
      (await validateEmail(email)) ||
      (await validatePassword(password, confirmPassword));

    if (alertMessage) {
      return res.status(400).json({
        success: false,
        message: alertMessage,
      });
    }

    console.log("End of signup validation")
    password = await bcrypt.hash(password, 10);

    // save the user to database 
    const referralCode = req.cookies.referralCode;
    console.log("referal code got in signup validation", referralCode)
    const savedUser = await createNewUser(name, email, phoneNumber, password, false, referralCode)
    req.user = savedUser
    // ------write this code in the startOtpvarifiction 
    // req.session.userEmail = email;
    // req.session.isVerified = false;
    // add user id to session too 
    return next()
  } catch (error) {
    console.log(error);
  }
};



module.exports = { signupValidations };
