const { checkProductsAvailability } = require("../utils/cartManagement");

const CartSchema = require("../models/Cart");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const CustomError = require("../utils/customError");
const { STATUS_CODES } = require("../utils/constants");

const compareOrderItems = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (req.session.checkoutProductId) {

      const product = await Product.findById(req.session.checkoutProductId)
      if (!product) {
        throw new CustomError( "Product not found", STATUS_CODES.BAD_REQUEST);
      }
      
      if (!product.isListed) {
        throw new CustomError( `"${product.productName}" is unavailable`, STATUS_CODES.BAD_REQUEST);
      }

      if (product.quantity === 0) {
        throw new CustomError( `"${product.productName}" is out of stock!`, STATUS_CODES.BAD_REQUEST);
      }
      req.cart = [product]

    } else if (req.session.cartCheckout) {
      req.session.checkoutProductId = null;

      const cart = await CartSchema.findOne({ userId });
      if (!cart || !cart.products || cart.products.length === 0) {
        throw new CustomError( "Cart is empty", STATUS_CODES.BAD_REQUEST);
      }

      // validate each item quantity and avialability of items
      const products = await checkProductsAvailability(cart);
      req.cart = cart;
    }
    
    return next();

  } catch (error) {
    next(error)
  }
};

module.exports = { compareOrderItems };
