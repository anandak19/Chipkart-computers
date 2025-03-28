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
// otp varification page
router.get("/varify-otp/:id",isVerified, authController.getVerify);
router.post("/varify-otp", authController.validateOtp);
router.get("/resend-otp", getUser, authController.startOtpVerification);

// forgot password
router.get("/forgot-password", authController.getForgotPassword)
router.post("/forgot-password", authController.postForgotPassword)
// new password 
router.get("/reset-password/:token", authController.getNewPasswordPage)
router.post("/reset-password/:token", authController.postNewPassword)

// check password reset status
router.get('/reset-password/reset/status', authController.checkPasswordResetStatus)
router.get('/reset-password/reset/success', authController.getResetPasswordSuccessPage)

// admin auth
router.get('/admin/login', isAdminLoginSubmitted, authController.getAdminLogin)
router.post('/admin/login', authController.postAdminLogin)
router.get('/admin/logout', authController.logoutUser)

module.exports = router;

