const { validateName, validateAddressType, validateAddressPhoneNumber, validatePincode, validateRequiredFields } = require("../utils/validations");

// validate all address fields 
exports.validateAddressFields = async (req, res, next) => {
  try {
    const {
      addressType,
      fullName,
      phoneNumber,
      addressLine,
      city,
      state,
      pincode,
      country,
    } = req.body;

    const errorMessage =
      validateName(fullName) ||
      validateAddressType(addressType) ||
      validateAddressPhoneNumber(phoneNumber) ||
      validatePincode(pincode) ||
      validateRequiredFields({ addressLine, city, state, country });

    if (errorMessage) {
      return res.status(400).json({ error: errorMessage });
    }

    return next()

  } catch (error) {
    console.error("Error validating address fields:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
