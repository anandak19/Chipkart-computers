const { checkProductsAvailability } = require("../utils/cartManagement");

const CartSchema = require("../models/Cart");
const Cart = require("../models/Cart");

const handleCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const cart = await CartSchema.findOne({ userId });

    if (!cart || !cart.products || cart.products.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const products = await checkProductsAvailability(cart);

    req.cart = cart
    console.log("Selected cart", cart)
    console.log("All products available:", products);
    return next()


  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { handleCart };
