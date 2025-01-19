const UserSchema = require("../models/User");
const bcrypt = require('bcrypt');
const {
  validateName,
  validatePhoneNumber,
  validateEmail,
  validatePassword,
} = require("../utils/validations");

const signupValidations = async (req, res, next) => {
  try {
    let { name, phoneNumber, email, password, confirmPassword } = req.body;

    console.log(req.body)
    // validate each entered input data 
    const alertMessage =
      (validateName(name)) ||
      (await validatePhoneNumber(phoneNumber)) ||
      (await validateEmail(email)) ||
      (await validatePassword(password, confirmPassword));

      // render the signup page with input error alert 
    if (alertMessage) {
      return res.render("user/signup", {
        name,
        phoneNumber,
        email,
        errorMessage: alertMessage
      });
    }

    password = await bcrypt.hash(password, 10);

    // save the user to database 
    const newUser = new UserSchema({ name, phoneNumber, email, password })
    await newUser.save()
    req.session.userEmail = email;
    req.session.isVerified = false;
    return next()
  } catch (error) {
    console.log(error);
  }
};

module.exports = { signupValidations };
