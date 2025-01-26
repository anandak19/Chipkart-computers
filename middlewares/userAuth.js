const User = require("../models/User"); // Adjust the path to your User model

// check if the user is varified 
const isVerified = async (req, res, next) => {
  console.log(
    "Getting OTP page: Checking verification status:",
    req.session.userEmail
  );

  try {
    if (!req.session.userEmail) {
      console.log("No email found in session");
      return res.redirect("/login");
    }

    const user = await User.findOne({ email: req.session.userEmail });

    if (!user) {
      console.log("User not found in the database");
      req.session.destroy();
      return res.redirect("/login");
    }

    if (user.isVerified) {
      console.log(user)
      console.log("User is verified");
      return res.redirect("/");
    }

    return next();
  } catch (error) {
    console.error("Error in isVerified middleware:", error);
    res.status(500).send("An unexpected error occurred.");
  }
};

// check if the user is login 
const isLogin = async (req, res, next) => {
  try {
    const userEmail = req?.session?.userEmail;
    const isLogin = req?.session?.isLogin;
    const userId = req?.session?.userId;

    // Check if session data exists
    if (!userEmail || !isLogin || !userId) {
      console.log("isLogin middleware: User is not logged in.");
      return res.redirect('/login');
    }

    // Verify the user exists in the database
    const user = await User.findById(userId);
    if (!user || user.email !== userEmail) {
      console.log("isLogin middleware: User not found in database or email mismatch.");
      return res.redirect('/login');
    }

    console.log("isLogin middleware: User is logged in and exists in the database.");
    return next();
  } catch (error) {
    console.error("isLogin middleware: Error occurred:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};





const isLogout = (req, res, next) => {
  if (req.session.userEmail || req.isAuthenticated()) {
    console.log("User already has an active session. Redirecting to home page.");
    return res.redirect('/');
  } else {
    console.log("No active session found. Proceeding to the next middleware.");
    return next();
  }
};

module.exports = {isVerified, isLogin, isLogout};
