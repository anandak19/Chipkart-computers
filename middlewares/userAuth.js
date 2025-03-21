const User = require("../models/User");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");

// check if the user is varified 
const isVerified = async (req, res, next) => {

  try {
    if (!req.session.userEmail) {
      return res.redirect("/login");
    }

    const user = await User.findOne({ email: req.session.userEmail });

    if (!user) {
      req.session.destroy();
      return res.redirect("/login");
    }

    if (user.isVerified) {
      return res.redirect("/");
    }

    return next();
  } catch (error) {
    return res.redirect("/login");
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
      return res.redirect('/login');
    }

    // Verify the user exists in the database
    const user = await User.findById(userId);
    if (!user || user.email !== userEmail) {
      return res.redirect('/login');
    }

    req.userId = userId
    return next();
  } catch (error) {
    console.error(error.message);
    res.redirect('/');
  }
};


// this code shoduld be changed to set another one 
const getUser = async (req, res, next) => {
  try {
    const userId = req.session.userId 
    if (!userId) {
      throw new CustomError( 'Session Expired', STATUS_CODES.BAD_REQUEST);
    }
    
    const user = await User.findById(userId); 
    
    if (!user) {
      throw new CustomError( 'User not found', STATUS_CODES.NOT_FOUND);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error)
  }
};

const isLogout = (req, res, next) => {
  if (req.session.userEmail || req.isAuthenticated()) {
    return res.redirect('/');
  } else {
    return next();
  }
};

const varifyLoginUserSession = async (req, res, next) => {
  try {
    const loggedInUser = req.session.user
    if (!req.session.isLogin && !loggedInUser) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({error: "Please Login First", redirect: true})
    }

    const user = await User.findById(loggedInUser.id)

    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: "User not found.", redirect: false });
    }

    req.user = user;

    return next()
    
  } catch (error) {
    return next(error)
  }
}

const checkIsblocked = async (req, res, next) => {
  if (req.user.isBlocked) {
    throw new CustomError( `You are being blocked for the reason: ${req.user.blockReason}`, STATUS_CODES.UNAUTHORIZED);
  }
  return next()
}

module.exports = {isVerified, isLogin, isLogout, getUser, varifyLoginUserSession, checkIsblocked};
