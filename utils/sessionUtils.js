const Address = require("../models/Address");
const Coupons = require("../models/Coupon");
const { getCartTotal } = require("./cartManagement");
const { getProductWithFinalPrice } = require("./productHelpers");

const calculateCheckoutAmount = async (req) => {
  try {
    let toPay;
    if (req.session.cartCheckout) {
      toPay = await getCartTotal(req.user._id);
    } else if (req.session.checkoutProductId) {
      product = await getProductWithFinalPrice(req.session.checkoutProductId);
      toPay = product.finalPrice;
    }

    let discountAmount = 0;
    if (req.session.appliedCouponId) {
      let coupon = await Coupons.findById(req.session.appliedCouponId);
      if (coupon) {
        discountAmount = (coupon.discount * toPay) / 100;
        toPay -= discountAmount;
      }
    }

    toPay = Math.floor(Math.max(0, toPay)) ;
    return { total: toPay, discountApplied: Math.floor(discountAmount)};
  } catch (error) {
    console.log(error);
    throw new Error("Error calculating checkout amount");
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
      throw new Error("No delivery address found");
    }

    return addressId
  } catch (error) {
    console.log(error)
    throw new Error("Error fetching delivery address");
  }
};

module.exports = { calculateCheckoutAmount, getDeliveryAddress };
