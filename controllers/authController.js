const UserSchema = require("../models/User");
const { sendEmailToUser } = require("../utils/email");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { validatePassword } = require("../utils/validations");
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
exports.startOtpVerification = async (req, res) => {
  try {
    let name, email;
    if (req.user) {
      email = req.user.email;
      name = req.user.name;
    }
    console.log("Started otp sending");

    // If no email is provided, return an error
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "No email found in request",
      });
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
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

    req.session.userEmail = req.user.email;
    req.session.isVerified = false;
    req.session.userId = req.user._id;
    req.session.isLogin = true;

    return res.status(200).json({
      status: "success",
      message: "OTP Send Successfully",
      redirectUrl: `/varify-otp/${String(req.user._id)}`,
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).send("An internal server error occurred");
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
exports.validateOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.userEmail;
    console.log("Verifying OTP and email:", otp);

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

    return res.status(200).json({
      // Changed from 400 to 200
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
    console.log(email, name);

    let user = await UserSchema.findOne({ email });
    if (!user) {
      newUser = new UserSchema({
        name,
        email,
        isVerified: true,
      });
      const user = await newUser.save();
      console.log("New user saved to the database:", user);
    }

    req.session.userEmail = user.email;
    req.session.isLogin = true;
    req.session.userId = user._id;

    return res.redirect("/account");
  } catch (error) {
    console.error("Error saving user to the database:", error);
    return res
      .status(500)
      .send("An error occurred while processing your request.");
  }
};

// get user login controller
exports.getUserLogin = (req, res) => {
  console.log(
    "Session userEmail login:",
    req.session.userEmail,
    req.isAuthenticated()
  );
  if (req.session.userEmail || req.isAuthenticated()) {
    res.redirect("/");
  } else {
    req.session.userEmail = false;
    res.render("user/auth/login", {
      email: req.flash("email") || "",
      errorMessage: req.flash("errorMessage"),
      isAuth: true,
    });
  }
};

// post user login
exports.postUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Started login process for email:", email);

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user by email
    const user = await UserSchema.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "You dont have account with us, Signup first!",
      });
    }

    // Compare the provided password with the stored password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Wrong password.",
      });
    }

    req.session.userEmail = user.email;
    req.session.isLogin = true;
    req.session.userId = user._id;

    res.status(200).json({
      success: true,
      message: "Login Successfull",
    });

    /*
    login api updated, now update the api call in clint 
    update this api name too 
    */
  } catch (error) {
    console.error("Error in login:", error);
    return res
      .status(500)
      .json({ success: true, error: "Internal server error" });
  }
};

// logout user
exports.logoutUser = async (req, res) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) {
      // for google users
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).send("An error occurred during logout.");
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Error while destroying session:", err);
            return res
              .status(500)
              .send("An unexpected error occurred while logging out.");
          }
          res.clearCookie("connect.sid");
          console.log("User logged out successfully.");
          return res.redirect("/");
        });
      });
    } else {
      // for normal users
      req.session.destroy((err) => {
        if (err) {
          console.error("Error while destroying session:", err);
          return res.status(500).send("An unexpected error occurred.");
        }
        res.clearCookie("connect.sid");
        console.log("Session destroyed for unauthenticated user.");
        return res.redirect("/");
      });
    }
  } catch (error) {
    console.error("Error in logoutUser:", error);
    res.status(500).send("An unexpected error occurred.");
  }
};

// admin auth
exports.getAdminLogin = (req, res) => {
  // if admin is logged in do not show this page
  req.session.isLogin = false;
  res.render("admin/login", {
    email: req.flash("email") || "",
    errorMessage: req.flash("errorMessage") || "",
    title: "Admin",
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

    req.session.isLogin = true;
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
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is needed" });
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
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

    req.session.isPasswordUpdated = false;
    res
      .status(200)
      .json({ message: "Check yor email for password reset link" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// get new password form page
exports.getNewPasswordPage = async (req, res) => {
  console.log(req.session.isPasswordUpdated);
  if (!req.session.isPasswordUpdated) {
    try {
      /*
      get the token from the path params
      varify the token and render the page to users
      else redirect to email entering page
      */
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
      return res.redirect("/");
    }
  }
};

exports.postNewPassword = async (req, res) => {
  // check if the user was alredy submited and changed the password

  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    console.log(token);

    if (!token) {
      res.status(400).json({ error: "Token not found" });
    }

    const user = await UserSchema.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const alertMessage = await validatePassword(password, confirmPassword);
    if (alertMessage) {
      res.status(400).json({ error: alertMessage });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ message: "Password saved succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
