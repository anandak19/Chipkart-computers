const { checkProductsAvailability } = require("../utils/cartManagement");

const CartSchema = require("../models/Cart");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const compareOrderItems = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (req.session.checkoutProductId) {

      const product = await Product.findById(req.session.checkoutProductId)
      if (!product) {
        return res.status(400).json({ error: "Product not found" });
      }
      
      if (!product.isListed) {
        return res.status(400).json({error: `"${product.productName}" is unavailable`})
      }

      if (product.quantity === 0) {
        return res.status(400).json({error: `"${product.productName}" is out of stock!`})
      }
      req.cart = [product]

    } else if (req.session.cartCheckout) {
      req.session.checkoutProductId = null;

      const cart = await CartSchema.findOne({ userId });
      if (!cart || !cart.products || cart.products.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // validate each item quantity and avialability of items
      const products = await checkProductsAvailability(cart);
      req.cart = cart;
      console.log("Selected cart", cart);
      console.log("All products available:", products);
    }
    
    return next();

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { compareOrderItems };
