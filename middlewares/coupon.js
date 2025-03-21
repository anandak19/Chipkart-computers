const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");

const validateCouponDetails = async (req, res, next) => {
  try {
    const {
      couponCode,
      discount,
      minOrderAmount,
      startDate,
      endDate,
      description,
    } = req.body;

    if (!couponCode || couponCode.length !== 5) {
      throw new CustomError(
        "Coupon code must have 5 charecters only",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (!discount || discount <= 0 || discount > 100) {
      throw new CustomError(
        "Discount must be a positive number less than 100",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (!minOrderAmount || minOrderAmount <= 0) {
      throw new CustomError(
        "Minimum order amount must be greater than 0.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (!description || description.length < 10) {
      throw new CustomError(
        "Description must be at least 10 characters.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new CustomError("Invalid date format", STATUS_CODES.BAD_REQUEST);
    }

    if (start < today) {
      throw new CustomError(
        "Start date must be today or a future date",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (end <= today) {
      throw new CustomError(
        "End date must be a future date",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (end <= start) {
      throw new CustomError(
        "End date must be after the start date",
        STATUS_CODES.BAD_REQUEST
      );
    }

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateCouponDetails };
