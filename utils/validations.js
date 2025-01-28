const UserSchema = require("../models/User");

const nameRegex = /^[a-zA-Z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[^\s]{4,}$/;

const validateName = (fullName) => {
  if (
    (!fullName && fullName.length < 2) ||
    fullName > 20 ||
    !nameRegex.test(fullName)
  ) {
    return "Full name must be between 2 and 20 characters long and contain only letters and spaces.";
  }
  return null;
};

const validateEmail = async (email) => {
  if (!email || !emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  const existingUser = await UserSchema.findOne({ email });
  if (existingUser) {
    return "This email is already registered. Please use a different email.";
  }
};

const validatePhoneNumber = async (phoneNumber) => {
  if (!phoneNumber || !phoneNumberRegex.test(phoneNumber)) {
    return "Please enter a valid phone number";
  }
  const existingUser = await UserSchema.findOne({ phoneNumber });
  if (existingUser) {
    return "This phone number is already registered. Please use a different phone number.";
  }
};

const validateUpdatedEmail = async (email) => {
  if (!email || !emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
};

const validatePassword = async (password, confirmPassword) => {
  if (!password || !passwordRegex.test(password)) {
    console.log("paswrd err");
    return "Password must be at least 4 characters long and include at least one letter and one number.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match. Please try again.";
  }
};

module.exports = {
  validateName,
  validateEmail,
  validatePhoneNumber,
  validateUpdatedEmail,
  validatePassword,
};
