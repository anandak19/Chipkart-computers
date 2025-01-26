const mongoose = require("mongoose");
const UserSchema = require("../models/User");
const { sendEmail } = require("../utils/email");
const bcrypt = require('bcrypt')

// Geting signup page
exports.getUserSignup = (req, res) => {
  console.log("Session userEmail:", req.session.userEmail);
  if (req.session.userEmail) {
    res.redirect("/signup/varify");
  } else {
    res.render("user/signup", {
      name: req.body.name || "",
      email: req.body.email || "",
      phoneNumber: req.body.phoneNumber || "",
      errorMessage: req.flash("errorMessage"),
    });
  }
};

// posting signup for varification
exports.otpVarify = async (req, res) => {
  try {
    let name, email;

    // Check if name and email exist in the request body
    if (req.body && req.body.name && req.body.email) {
      ({ name, email } = req.body);
    } else if (req.session && req.session.userEmail) {
      email = req.session.userEmail;
    }

    // If no email is provided, return an error
    if (!email) {
      req.flash("errorMessage", "Failed to send OTP, please try again.");
      return res.redirect("/signup");
    }

    console.log(email, name);

    const otp = Math.floor(1000 + Math.random() * 9000);
    const currentTime = new Date();
    const otpExpires = new Date(currentTime.getTime() + 60 * 1000);

    const subject = "Your OTP Code";
    const text = otp.toString();

    // Send the OTP email
    sendEmail(name, email, subject, text, async (error, response) => {
      if (error) {
        console.log("Email sending failed:", error);
        req.flash("error", "Failed to send OTP! Please try again");
        return res.redirect("/signup/varify");
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
          req.flash("success", "Enter the OTP send to to your email");
          return res.redirect("/signup/varify");
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
    console.log("varifying otp and email", otp)

    if (!email) {
      return res.redirect("/signup");
    }

    if (!otp) {
      req.flash("error", "Enter your OTP");
      return res.redirect("/signup/varify");
    }

    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.redirect("/signup");
    }

    // Check if the OTP matches and hasn't expired
    const currentTime = new Date();
    if (user.otp !== otp || currentTime > new Date(user.otpExpires)) {
      req.flash("error", "Invalid or expired OTP!");
      return res.redirect("/signup/varify");
    }

    req.session.isVerified = true;
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    console.log("is varified 1: ", req.session.isVerified);
    await user.save();
    res.redirect("/");
  } catch (error) {
    console.error("Error during OTP verification:", error);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/signup/varify");
  }
};

// register the user using google auth 
exports.registerGoogleUser = async (req, res) =>{
  try {
    const profile = req.user

    const email = profile.emails[0].value
    const name = profile.displayName
    console.log(email, name)

    let user = await UserSchema.findOne({ email });
    if (!user) {
      newUser = new UserSchema({
        name, email, isVerified: true, 
      })
      const user = await newUser.save();
      console.log('New user saved to the database:', user);
    }

    req.session.userEmail = user.email;
    req.session.isLogin = true
    req.session.userId = user._id;

    return res.redirect('/account');


  } catch (error) {
    console.error('Error saving user to the database:', error);
    return res.status(500).send('An error occurred while processing your request.');
  }
}

// get user login controller
exports.getUserLogin = (req, res) => {
  console.log("Session userEmail login:", req.session.userEmail, req.isAuthenticated());
  if (req.session.userEmail || req.isAuthenticated()) {
    res.redirect("/");
  } else {
    req.session.userEmail = false
    res.render("user/login", {
      email: req.flash("email") || "",
      errorMessage: req.flash("errorMessage"),
    });
  }
};

// post user login
exports.postUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      req.flash("errorMessage", "Email and password are required.");
      return res.redirect('/login')
    }

    // Find user by email
    const user = await UserSchema.findOne({ email });

    // Check if the user exists
    if (!user) {
      req.flash("errorMessage", "You dont have account with us.");
      return res.redirect('/login')
    }

    // Compare the provided password with the stored password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      req.flash("errorMessage", "Wrong password.");
      req.flash("email", email);
      return res.redirect('/login')
    }

    req.session.userEmail = user.email;
    req.session.isLogin = true
    req.session.userId = user._id;

    return res.redirect("/");
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ error: "Internal server error" });
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
            return res.status(500).send("An unexpected error occurred while logging out.");
          }
          res.clearCookie('connect.sid');
          console.log("User logged out successfully.");
          return res.redirect('/');
        });
      });
    } else {
      // for normal users
      req.session.destroy((err) => {
        if (err) {
          console.error("Error while destroying session:", err);
          return res.status(500).send("An unexpected error occurred.");
        }
        res.clearCookie('connect.sid');
        console.log("Session destroyed for unauthenticated user.");
        return res.redirect('/');
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
  req.session.isLogin = false
  res.render('admin/login', {
    email: req.flash('email') || '',
    errorMessage: req.flash('errorMessage') || '',
  });
};

exports.postAdminLogin = async(req, res) => {
  try {
    const {email, password} = req.body
    console.log(email, password)

    if (!email || !password) {
      req.flash('errorMessage', 'Please enter the credentials')
    }

    const admin = await UserSchema.findOne({email})
    if (!admin) {
      req.flash('errorMessage', 'Admin not found. Please check your email.');
      return res.redirect('/admin/login');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      req.flash("errorMessage", "Wrong password.");
      req.flash("email", email);
      return res.redirect('/admin/login');
    }

    if (!admin.isAdmin) {
      req.flash("errorMessage", "You are not an admin");
      return res.redirect('/admin/login');
    }

    req.session.isLogin = true
    req.session.email = admin.email
    res.redirect('/admin')
  } catch (error) {
    console.log(error) 
    req.flash("errorMessage", "Server error");
    return res.redirect('/admin/login');
  }
};
