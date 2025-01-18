const mongoose = require("mongoose");
const UserSchema = require("../models/User");
const { sendEmail } = require("../utils/email");

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
exports.getVarify = async (req, res) => {
    console.log("is varified in otp: ", req.session.isVerified)
    if (req.session.isVerified) {
        res.redirect("/");
    }else{
        try {
            const email = req.session.userEmail;
        
            // Check if the user is logged in
            if (!email) {
              // change it to login later 
              return res.redirect("/signup");
            }
        
            const user = await UserSchema.findOne({ email });
        
            if (!user) {
              // change it to login later 
              return res.redirect("/signup");
            }
        
            if (user.isVerified) {
              return res.redirect("/");
            }
        
            // If the user is not verified, render the OTP verification page
            res.render("user/verification", {
              successMessage: req.flash("success"),
              errorMessage: req.flash("error"),
            });
        
          } catch (error) {
            console.error("Error in getVarify route:", error);
            req.flash("error", "Something went wrong, please try again.");
            res.redirect("/signup")
          }
    }
};
  
// submit the otp page 
exports.validateOtp = async (req, res) => {
    try {
      const { otp } = req.body;
      const email = req.session.userEmail;
  
      if (!email) {
        return res.redirect("/signup");
      }
  
      const user = await UserSchema.findOne({ email });
  
      if (!user) {
        return res.redirect("/signup");
      }
  
      // Check if the OTP matches and hasn't expired
      const currentTime = new Date();
      if (user.otp !== otp || currentTime > new Date(user.otpExpires)) {
        req.flash('error', 'Invalid or expired OTP!');
        return res.redirect("/signup/varify");
      }
  
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      req.session.isVerified = true
      console.log("is varified 1: ", req.session.isVerified)
      await user.save();
      res.redirect("/");
  
    } catch (error) {
      console.error('Error during OTP verification:', error);
      req.flash('error', 'Something went wrong. Please try again.');
      res.redirect("/signup/varify");
    }
};

// get user login controller
exports.getUserLogin = (req, res) => {
    console.log("Session userEmail login:", req.session.userEmail);
    if (req.session.userEmail) {
      res.redirect("/");
    } else {
      res.render("user/login", {
        email: req.body.email || "",
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
        return res.status(400).json({ error: "Email and password are required" });
      }
  
      // Find user by email
      const user = await UserSchema.findOne({ email });
  
      // Check if the user exists
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Compare the provided password with the stored password in the database
      if (user.password !== password) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      // Create a session for the user
      req.session.userEmail = user.email; // Store user email in session
      req.session.userId = user._id; // Optionally store the user ID
  
      return res.status(200).json({ message: "Login successful" });
  
    } catch (error) {
      console.error("Error in login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// admin auth
exports.getAdminLogin = (req, res) => {
  res.send("getAdminLogin");
};

exports.postAdminLogin = (req, res) => {
  res.send("postAdminLogin");
};
