const express = require("express");
const authController = require("../controllers/authController");
const { signupValidations } = require("../middlewares/signupValidation");
const {isVerified, isLogin, isLogout, getUser} = require("../middlewares/userAuth");
const passport = require('passport');
const { isAdminLoginSubmitted } = require("../middlewares/adminAuth");

const router = express.Router();

// // user auth
router.get("/login", isLogout, authController.getUserLogin);
router.post('/login', authController.postUserLogin);
router.get('/logout', authController.logoutUser);

// google auth 
router.get('/auth/google', passport.authenticate("google", {scope: ["profile", "email"]}))
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: "/"}), authController.registerGoogleUser)

// user signup
router.get("/signup", authController.getUserSignup);
// users data is saved to db in signup validation itself 
router.post("/signup", signupValidations, authController.startOtpVerification);
// otp varification page    isVerified
router.get("/varify-otp/:id", authController.getVerify);
router.post("/varify-otp/:id", authController.validateOtp);
// THIS CALL BACK NEED UPDATION
router.get("/resend-otp", getUser, authController.startOtpVerification);

// // admin auth
router.get('/admin/login', isAdminLoginSubmitted, authController.getAdminLogin)
router.post('/admin/login', authController.postAdminLogin)
router.get('/admin/logout', authController.logoutUser)

module.exports = router;


/*
write a methog to get the user id from the path params and save it in req.user

*/
