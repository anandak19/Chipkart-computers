const Address = require("../models/Address");
const Coupons = require("../models/Coupon");
const { getCartTotal } = require("./cartManagement");
const { STATUS_CODES } = require("./constants");
const CustomError = require("./customError");
const { getProductWithFinalPrice } = require("./productHelpers");

const calculateCheckoutAmount = async (req) => {
  try {
    let totalAmount;
    if (req.session.cartCheckout) {
      totalAmount = await getCartTotal(req.user._id);
    } else if (req.session.checkoutProductId) {
      product = await getProductWithFinalPrice(req.session.checkoutProductId);
      totalAmount = product.finalPrice;
    }

    const shippingFee = totalAmount < 5000 ? 100 : 0;

    let discountAmount = 0;
    if (req.session.appliedCouponId) {
      let coupon = await Coupons.findById(req.session.appliedCouponId);
      if (coupon) {
        discountAmount = Math.floor((coupon.discount * totalAmount) / 100);
      }
    }
    totalAmount = Math.floor(Math.max(0, totalAmount));
    const totalPayable = shippingFee + totalAmount - discountAmount;

    return { total: totalAmount, shippingFee, discountApplied: discountAmount, totalPayable };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Error calculating checkout amount', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

const getDeliveryAddress = async (req) => {
  try {
    let addressId = req.session.deliveryAddress;
    const userId = req.user._id;
    if (!req.session.deliveryAddress) {
      const address = await Address.findOne(
        { userId: userId, isDefault: true },
        "_id"
      );

      addressId = address ? address._id : null;
    } else {
      const address = await Address.findOne({ _id: addressId }, "_id");
      addressId = address ? address._id : null;
    }

    if (!addressId) {
      throw new CustomError( "No delivery address found! Add an address", STATUS_CODES.NOT_FOUND);
    }

    return addressId;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Error fetching delivery address", STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = { calculateCheckoutAmount, getDeliveryAddress };
