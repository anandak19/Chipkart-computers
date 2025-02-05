const ProductSchema = require("../models/Product");
const CartSchema = require("../models/Cart");
const UserSchema = require("../models/User");
const mongoose = require("mongoose");
require("dotenv").config();
const {
  decreaseProductQuantity,
  increaseProductQuantity,
} = require("../utils/productQtyManagement");
const { getUserCartItems } = require("../utils/cartManagement");

const maxQty = Number(process.env.MAX_QTY);

exports.getCartPage = (req, res) => {
  res.render("user/account/cart");
};

exports.getCartItems = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }
    const userId = req.user._id;
    const { p } = req.query;
    const page = Number(p) || 0;
    const limit = 5;
    const skip = page * limit;

    console.log(userId);

    /*
    match the cart from db with userId
    unwind the product array 
    join with the product collection
    */

    const pipeline = [
      {
        $match: { userId: userId },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          "products.productId": 1,
          "products.quantity": 1,
          "products.name": "$productDetails.productName",
          "products.price": "$productDetails.finalPrice",
          "products.image": "$productDetails.images",
          "products.subTotalPrice": {
            $multiply: ["$productDetails.finalPrice", "$products.quantity"],
          },
        },
      },
      {
        $facet: {
          productCount: [{ $count: "total" }],
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];


    const cart = await CartSchema.aggregate(pipeline);

    const productCount = cart[0].productCount[0];
    const products = cart[0]?.paginatedResult || [];

    const total = productCount ? productCount.total : 0;
    const hasMore = skip + products.length < total;

    res.status(200).json({ products, total, hasMore });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// to add an an item to cart, product quantity will decrese in products too
exports.addItemToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // FROM HERE ----
    if (!req.user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found in request." });
    }

    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Product not found in request." });
    }

    const product = await ProductSchema.findById(productId).session(session);

    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Invalid product" });
    }

    // TO HERE -- TRY TO MAKE IT A MIDDLEWARE LATER

    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      const updatedProduct = await decreaseProductQuantity(productId, session);

      if (!updatedProduct) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ error: "Product not available or out of stock" });
      }

      cart = new CartSchema({
        userId,
        products: [{ productId, quantity: 1 }],
      });
    } else {
      const existingProduct = cart.products.find((p) =>
        p.productId.equals(productId)
      );

      if (!existingProduct) {
        const updatedProduct = await decreaseProductQuantity(
          productId,
          session
        );
        if (!updatedProduct) {
          await session.abortTransaction();
          return res
            .status(400)
            .json({ error: "Product not available or out of stock." });
        }

        cart.products.push({ productId, quantity: 1 });
      } else {
        await session.commitTransaction();
        return res.status(200).json({ message: "Products already in cart" });
      }
    }

    console.log(cart);
    await cart.save({ session });

    await session.commitTransaction();

    return res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
};

// to increase the quantity of the item in the cart
exports.increaseCartItemQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // repeater code --
    if (!req.user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found in request." });
    }

    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Product not found in request." });
    }

    // reperter code end
    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User have no cart." });
    }

    // find the requested product from cart
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

    if (productIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({
        error:
          "Product not founded in users cart! Add the product to cart first",
      });
    }

    // check if the current quantity is greater than limit
    if (cart.products[productIndex].quantity >= maxQty) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ error: `User can add only upto ${maxQty} quantity of item` });
    }

    // decrement product quantity from db
    const updatedProduct = await decreaseProductQuantity(productId, session);
    if (!updatedProduct) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ error: "Product not available or out of stock." });
    }

    cart.products[productIndex].quantity++;

    await cart.save({ session });

    await session.commitTransaction();

    return res.status(200).json({ message: "Product incremented" });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
};

// to decrease the cart item quantity
exports.decreaseCartItemQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // repeater code --
    if (!req.user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found in request." });
    }

    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Product not found in request." });
    }

    // reperter code end
    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User have no cart." });
    }

    // find the requested product from cart
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

    if (productIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({
        error:
          "Product not founded in users cart! Add the product to cart first",
      });
    }

    // check if the current quantity is greater than limit
    if (cart.products[productIndex].quantity === 1) {
      await session.abortTransaction();
      return res.status(404).json({
        error:
          "Minimum 1 one quantity is needed. Try deleting the item to remove from cart",
      });
    }

    // decrement product quantity from db
    const updatedProduct = await increaseProductQuantity(productId, session);
    if (!updatedProduct) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ error: "Product not available or out of stock." });
    }

    cart.products[productIndex].quantity--;

    await cart.save({ session });

    await session.commitTransaction();

    return res.status(200).json({ message: "Product decremented" });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
};

// to remove a item from cart
exports.deleteCartItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // repeater code --
    if (!req.user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found in request." });
    }

    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Product not found in request." });
    }

    // reperter code end
    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User have no cart." });
    }

    // find the requested product from cart
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

    if (productIndex !== -1) {
      cart.products.splice(productIndex, 1);
    }

    // decrement product quantity from db
    const updatedProduct = await increaseProductQuantity(productId, session);
    if (!updatedProduct) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ error: "Product not available or out of stock." });
    }

    await cart.save({ session });

    await session.commitTransaction();

    return res.status(200).json({ message: "Product removed from cart" });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
};

// get the cart total prices
exports.getCartTotal = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const userId = req.user._id;

    const cart = await getUserCartItems(userId);

    const cartSubTotal = cart.reduce((total, item) => {
      return total + (item.products.subTotalPrice || 0);
    }, 0);

    let shippingFee = 0;
    let cartTotal = 0;

    if (cartSubTotal > 0) {
      shippingFee = cartSubTotal < 5000 ? 100 : 0;
      cartTotal = cartSubTotal + shippingFee;
    }

    res.status(200).json({ cartSubTotal, shippingFee, cartTotal });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/*
--controllers

to add a product to cart
to get the cart page
to increese the quantity of a product in cart
to decreese teh quantity of a product in cart
to remove a product from cart

to get order placing page (order proceed)
to applay coupen on order
to use the wallet amount on order
to place the order

to get the order history page
to cancel a order
*/
