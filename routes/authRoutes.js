const express = require("express");
const authController = require("../controllers/authController");
const { signupValidations } = require("../middlewares/signupValidation");
const {isVerified, isLogin, isLogout} = require("../middlewares/userAuth");
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
router.post("/signup", signupValidations, authController.otpVarify);
// otp varification page
router.get("/signup/varify", isVerified, authController.getVerify);
router.post("/signup/varify", authController.validateOtp);
router.post("/signup/resend-otp", authController.otpVarify);

// // admin auth
router.get('/admin/login', isAdminLoginSubmitted, authController.getAdminLogin)
router.post('/admin/login', authController.postAdminLogin)
router.get('/admin/logout', authController.logoutUser)

module.exports = router;
