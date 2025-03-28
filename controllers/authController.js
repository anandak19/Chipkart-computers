const UserSchema = require("../models/User");
const { sendEmailToUser } = require("../utils/email");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Session = mongoose.connection.collection("sessions");
const { validatePassword } = require("../utils/validations");
const logoutUser = require("../utils/logoutUser");
const { createNewUser } = require("../utils/userHelpers");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");
require("dotenv").config();

// Geting signup page
exports.getUserSignup = (req, res) => {
  console.log("Session userEmail:", req.session.userEmail);
  if (req.session.userEmail && req.session.userId) {
    res.redirect(`/varify-otp/${req.session.userId}`);
  } else {
    res.render("user/auth/signup", {
      name: req.body.name || "",
      email: req.body.email || "",
      phoneNumber: req.body.phoneNumber || "",
      errorMessage: req.flash("errorMessage"),
      isAuth: true,
    });
  }
};

// posting signup for varification
exports.startOtpVerification = async (req, res, next) => {
  try {
    let name, email;
    if (req.user) {
      email = req.user.email;
      name = req.user.name;
    }

    // If no email is provided, return an error
    if (!email) {
      throw new CustomError("No email found in request", STATUS_CODES.BAD_REQUEST);
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      throw new CustomError("User not found", STATUS_CODES.NOT_FOUND);
    }

    // make this code a separate utility later
    const otp = Math.floor(1000 + Math.random() * 9000);
    const currentTime = new Date();
    const otpExpires = new Date(currentTime.getTime() + 60 * 1000);

    const subject = "Your OTP Code";
    const text = otp.toString();
    const html = `<p>Dear ${name},</p><p>Your OTP for verification is: <b>${text}</b></p><p>Regards,<br>Chipkart Computers</p>`;

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmailToUser(user.email, html, subject);

    req.session.user = {
      email: user.email,
      id: user._id,
      name: user.name,
    };
    req.session.cookieName = "userSession";
    // remove the below code later
    req.session.userEmail = req.user.email;
    req.session.isVerified = false;
    req.session.userId = req.user._id;
    req.session.isLogin = true;

    return res.status(STATUS_CODES.SUCCESS).json({
      status: "success",
      message: "OTP Send Successfully",
      redirectUrl: `/varify-otp/${String(req.user._id)}`,
    });
  } catch (error) {
    next(error)
  }
};

// get the otp  page
exports.getVerify = async (req, res) => {
  return res.render("user/auth/verification", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
};

// submit the otp page
exports.validateOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = req.session.userEmail;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Login is required",
        redirect: true,
        redirectUrl: "/signup",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please enter the OTP you received in your email",
        redirect: false,
      });
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "You don't have an account with us. Please sign up first.",
        redirect: true,
        redirectUrl: "/signup",
      });
    }

    // Check if the OTP matches and hasn't expired
    const currentTime = new Date();
    if (user.otp !== otp || currentTime > new Date(user.otpExpires)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP!",
        redirect: false,
      });
    }

    // Mark user as verified
    req.session.isVerified = true;
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    console.log("Is verified:", req.session.isVerified);
    await user.save();

    return res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Verification successful!",
      redirect: true,
      redirectUrl: "/",
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
      redirect: false,
    });
  }
};

// register the user using google auth
exports.registerGoogleUser = async (req, res) => {
  try {
    const profile = req.user;

    const email = profile.emails[0].value;
    const name = profile.displayName;

    // check if the user exists, if not create one
    let user = await UserSchema.findOne({ email });
    if (!user) {
      // create new user and create a wallet for user
      const referralCode = req.cookies.referralCode;
      user = await createNewUser(
        name,
        email,
        undefined,
        undefined,
        true,
        referralCode
      );
    }

    // to identify each each sessions in db
    req.session.userId = user._id.toString();

    const sessionUser = await Session.findOne({
      "session.userId": req.session.userId,
    });

    // if user is blockd
    if (user.isBlocked) {
      res.cookie(
        "errorMessage",
        `You are being blocked for the reason: ${user.blockReason}`,
        {
          maxAge: 9000,
          httpOnly: true,
        }
      );

      await Session.deleteMany({ "session.userId": req.session.userId });

      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });

      return res.redirect("/login");
    }

    req.session.user = {
      email: user.email,
      id: user._id,
      name: user.name,
    };
    req.session.userEmail = user.email;
    req.session.isLogin = true;

    await req.session.save();
    return res.redirect("/account");
  } catch (error) {
    console.error("Error saving user to the database:", error);
    return res.redirect("/");
  }
};

// get user login controller
exports.getUserLogin = (req, res) => {
  if (req.session.isLogin || req.isAuthenticated()) {
    res.redirect("/");
  } else {
    req.session.isLogin = false;
    const errorMessage = req.cookies.errorMessage || req.flash("errorMessage");
    res.clearCookie("errorMessage");
    res.render("user/auth/login", {
      email: req.flash("email") || "",
      errorMessage: errorMessage,
      isAuth: true,
    });
  }
};

// post user login
exports.postUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Check if email and password are provided
    if (!email || !password) {
      throw new CustomError("Email and password are required.", STATUS_CODES.BAD_REQUEST);
    }

    // Find user by email
    const user = await UserSchema.findOne({ email });

    // Check if the user exists
    if (!user) {
      throw new CustomError("You dont have account with us, Signup first!", STATUS_CODES.BAD_REQUEST);
    }

    // Compare the provided password with the stored password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomError("Wrong password.", STATUS_CODES.BAD_REQUEST);
    }

    // check if the user is blocked
    if (user.isBlocked) {
      throw new CustomError(`Your are being blocked for the reason: ${user.blockReason}`, STATUS_CODES.BAD_REQUEST);
    }

    req.session.user = {
      email: user.email,
      id: user._id,
      name: user.name,
    };
    req.session.isLogin = true;
    // remove this from other routes and use the above object for the existing purpose
    req.session.userEmail = user.email;
    req.session.userId = user._id.toString();

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Login Successfull",
    });

    /*
    login api updated, now update the api call in clint 
    update this api name too 
    */
  } catch (error) {
    next(error)
  }
};

// logout user
exports.logoutUser = async (req, res) => {
  try {
    await logoutUser(req, res);
    return res.redirect("/");
  } catch (error) {
    console.error("Logout Error:", error);
    return res.redirect("/");
  }
};

// admin auth
exports.getAdminLogin = (req, res) => {
  // if admin is logged in do not show this page
  req.session.isAdminLogin = false;
  res.render("admin/login", {
    title: "Admin",
    email: req.flash("email") || "",
    errorMessage: req.flash("errorMessage") || "",
  });
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    if (!email || !password) {
      req.flash("errorMessage", "Please enter the credentials");
    }

    const admin = await UserSchema.findOne({ email });
    if (!admin) {
      req.flash("errorMessage", "Admin not found. Please check your email.");
      return res.redirect("/admin/login");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      req.flash("errorMessage", "Wrong password.");
      req.flash("email", email);
      return res.redirect("/admin/login");
    }

    if (!admin.isAdmin) {
      req.flash("errorMessage", "You are not an admin");
      return res.redirect("/admin/login");
    }

    req.session.isAdminLogin = true;
    req.session.email = admin.email;
    req.session.adminId = admin._id;
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
    req.flash("errorMessage", "Server error");
    return res.redirect("/admin/login");
  }
};

// to get Forgotpassord ------------------working
exports.getForgotPassword = async (req, res) => {
  return res.render("user/auth/forgotPassword", {
    isAuth: true,
    errorMessage: req.flash("error")[0] || " ",
  });
};

// post forgot password form
// user will send a email in body
// server varify email and user, create a token and save it in user with 1 hr expiration
// send the reset link to usr in email
exports.postForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new CustomError( "Email is needed", STATUS_CODES.BAD_REQUEST);
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      throw new CustomError("User not found", STATUS_CODES.NOT_FOUND);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    console.log(resetToken);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    console.log(user);

    const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    const html = `<p>Dear ${user.name},</p><p>Click <a href="${resetLink}">here</a> to reset your password. The link will expire in 1 hour</p>Regards,<br>Chipkart Computers</p>`;
    await user.save();

    await sendEmailToUser(user.email, html, "Reset Password", resetLink);

    req.session.passwordResetSuccess = false;
    req.session.isPasswordUpdated = false;
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Check yor email for password reset link" });
  } catch (error) {
    next(error)
  }
};

// get new password form page
exports.getNewPasswordPage = async (req, res) => {
  console.log(req.session.isPasswordUpdated);
  if (!req.session.isPasswordUpdated) {
    try {
      const { token } = req.params;

      if (!token) {
        console.log("Token missing");
        req.flash("error", "Token not found, Please try again");
        return res.redirect("/forgot-password");
      }

      const user = await UserSchema.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        console.log("Token expired");
        req.flash("error", "Password reset link expired! Please try agin");
        return res.redirect("/forgot-password");
      }

      return res.render("user/auth/newPassword", {
        isAuth: true,
      });
    } catch (error) {
      console.log(error);
      req.flash("error", "Internal server error! Try agin later");
      return res.redirect("/forgot-password");
    }
  }
};

exports.postNewPassword = async (req, res, next) => {
  // check if the user was alredy submited and changed the password
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    console.log(token);

    if (!token) {
      throw new CustomError("Your are not authenticated", STATUS_CODES.BAD_REQUEST);
    }

    const user = await UserSchema.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new CustomError("Invalid or expired token.", STATUS_CODES.BAD_REQUEST);
    }

    const alertMessage = validatePassword(password, confirmPassword);
    if (alertMessage) {
      throw new CustomError(alertMessage, STATUS_CODES.BAD_REQUEST);
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    req.session.passwordResetSuccess = true;

    res.status(STATUS_CODES.SUCCESS).json({ message: "Password saved succesfully" });
  } catch (error) {
    next(error)
  }
};

exports.checkPasswordResetStatus = (req, res) => {
  if (req.session.passwordResetSuccess) {
    res.json({ resetCompleted: true });
    req.session.passwordResetSuccess = false;
  } else {
    res.json({ resetCompleted: false });
  }
};

exports.getResetPasswordSuccessPage = (req, res) => {
  return res.render("user/auth/passwordResetSuccess");
};
