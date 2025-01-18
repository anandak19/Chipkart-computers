const express = require("express");
const authController = require("../controllers/authController");
const { signupValidations } = require("../middlewares/signupValidation");

const router = express.Router();

// // user auth
router.get("/login", authController.getUserLogin);
router.post('/login', authController.postUserLogin)

// // admin auth
// router.get('/login', authController.getAdminLogin)
// router.post('/login', authController.postAdminLogin)

// user signup
router.get("/signup", authController.getUserSignup);
router.post("/signup", signupValidations, authController.otpVarify);
// otp varification page 
router.get("/signup/varify", authController.getVarify)
router.post("/signup/varify", authController.validateOtp)
router.post("/signup/resend-otp", authController.otpVarify);


module.exports = router;
