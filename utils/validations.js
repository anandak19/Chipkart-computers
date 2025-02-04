const UserSchema = require("../models/User");

const nameRegex = /^[a-zA-Z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10,13}$/;
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

const validateAddressPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || !phoneNumberRegex.test(phoneNumber)) {
    return "Please enter a valid phone number";
  }
  return null
}

const validateUpdatedEmail = async (email) => {
  if (!email || !emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
};

const validatePassword = (password, confirmPassword) => {
  if (!password || !passwordRegex.test(password)) {
    console.log("paswrd err");
    return "Password must be at least 4 characters long and include at least one letter and one number.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match. Please try again.";
  }
};

const validateDob = (dob) => {
  const inputDate = new Date(dob);
  const today = new Date();

  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 100);

  if (inputDate > today) {
    return "Date of birth cannot be in the future!";
  } else if (inputDate < minDate) {
    return "Date of birth cannot be more than 100 years old!";
  } 

}

const validateAddressType = (addressType) => {
  const validTypes = ["Home", "Work", "Other"];
  
  if (!validTypes.includes(addressType)) {
    return "Please select a valid address type";
  }

  return null;
};

const validatePincode = (pincode) => {
  const pincodeRegex = /^\d{4,10}$/; 

  if (!pincodeRegex.test(pincode)) {
    return "Please enter a valid pincode (4 to 10 digits).";
  }

  return null; 
};

const validateRequiredFields = (fields) => {
  for(const [key, value] of Object.entries(fields)) {
    if (!value || value.trim() === "") {
      return `${key} id required`
    }
  }
  return null
}


module.exports = {
  validateName,
  validateEmail,
  validatePhoneNumber,
  validateUpdatedEmail,
  validatePassword,
  validateDob,
  validateAddressType,
  validateAddressPhoneNumber,
  validatePincode,
  validateRequiredFields,
};
