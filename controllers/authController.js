const mongoose = require("mongoose");
const UserSchema = require("../models/User");
const { sendEmail } = require("../utils/email");
const bcrypt = require("bcrypt");

// Geting signup page
exports.getUserSignup = (req, res) => {
  console.log("Session userEmail:", req.session.userEmail);
  if (req.session.userEmail && req.session.userId) {
    res.redirect(`/varify-otp/${req.session.userId}`);
  } else {
    res.render("user/signup", {
      name: req.body.name || "",
      email: req.body.email || "",
      phoneNumber: req.body.phoneNumber || "",
      errorMessage: req.flash("errorMessage"),
      isAuth: true
    });
  }
};

// posting signup for varification
exports.startOtpVerification = async (req, res) => {
  /*
  generate the otp and send to user
  if send succss, respond to req as succesfull

  */

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

    // make this code a separate utility later
    const otp = Math.floor(1000 + Math.random() * 9000);
    const currentTime = new Date();
    const otpExpires = new Date(currentTime.getTime() + 60 * 1000);

    const subject = "Your OTP Code";
    const text = otp.toString();

    // Send the OTP email
    sendEmail(name, email, subject, text, async (error, response) => {
      // if error in sending the otp
      if (error) {
        console.log("Email sending failed:", error);
        return res.status(500).json({
          status: "error",
          success: false,
          message: "Failed to send OTP! Please try again.",
        });
      }
      console.log(response);

      // Update the user's OTP and expiration time in the database
      try {
        const result = await UserSchema.updateOne(
          { email },
          {
            $set: {
              otp,
              otpExpires,
            },
          }
        );

        // If the user was found and the update was successful
        if (result.modifiedCount > 0) {
          console.log("OTP and expiration time updated successfully");

          req.session.userEmail = req.user.email;
          req.session.isVerified = false;
          req.session.userId = req.user._id;
          req.session.isLogin = true;

          return res.status(200).json({
            status: "success",
            message: "OTP Send Successfully",
            redirectUrl: `/varify-otp/${String(req.user._id)}`,
          });
        } else {
          console.log("User not found or update failed", result);
          return res.status(404).send("User not found or update failed");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).send("Internal server error while updating OTP");
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).send("An internal server error occurred");
  }
};

// resend new otp / this will be reset later
exports.resendOtp = async (req, res) => {
  /*
  generate the otp and send to user
  if send succss, respond to req as succesfull

  */

  try {
    let name, email;
    if (req.user) {
      email = req.user.email;
      name = req.user.name;
    }

    // If no email is provided, return an error
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "No email found in request",
      });
    }

    // make this code a separate utility later
    const otp = Math.floor(1000 + Math.random() * 9000);
    const currentTime = new Date();
    const otpExpires = new Date(currentTime.getTime() + 60 * 1000);

    const subject = "Your OTP Code";
    const text = otp.toString();

    // Send the OTP email
    sendEmail(name, email, subject, text, async (error, response) => {
      // if error in sending the otp
      if (error) {
        console.log("Email sending failed:", error);
        return res.status(500).json({
          status: "error",
          success: false,
          message: "Failed to send OTP! Please try again.",
        });
      }
      console.log(response);

      // Update the user's OTP and expiration time in the database
      try {
        const result = await UserSchema.updateOne(
          { email },
          {
            $set: {
              otp,
              otpExpires,
            },
          }
        );

        // If the user was found and the update was successful
        if (result.modifiedCount > 0) {
          console.log("OTP and expiration time updated successfully");

          req.session.userEmail = req.user.email;
          req.session.isVerified = false;
          req.session.userId = req.user._id;

          return res.status(200).json({
            status: "success",
            message: "OTP Send Successfully",
            redirectUrl: `/varify-otp/${String(req.user._id)}`,
          });
        } else {
          console.log("User not found or update failed", result);
          return res.status(404).send("User not found or update failed");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).send("Internal server error while updating OTP");
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).send("An internal server error occurred");
  }
};

// get the otp  page
exports.getVerify = async (req, res) => {
  return res.render("user/verification", {
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
    res.render("user/login", {
      email: req.flash("email") || "",
      errorMessage: req.flash("errorMessage"),
      isAuth: true
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
    return res.status(500).json({ success: true, error: "Internal server error" });
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
    title: 'Admin'
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
    req.session.adminId = admin._id
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
    req.flash("errorMessage", "Server error");
    return res.redirect("/admin/login");
  }
};
