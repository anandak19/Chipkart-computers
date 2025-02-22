const ProductSchema = require("../models/Product");
const CartSchema = require("../models/Cart");
const UserSchema = require("../models/User");
const AddressShema = require("../models/Address");
const OrderSchema = require("../models/Order");
const OrderItem = require("../models/orderItem");
const mongoose = require("mongoose");
require("dotenv").config();
const {
  decreaseProductQuantity,
  increaseProductQuantity,
} = require("../utils/productQtyManagement");
const { getUserCartItems, getCartTotal } = require("../utils/cartManagement");
const { addFinalPriceStage, getProductWithFinalPrice } = require("../utils/productHelpers");
const Coupons = require("../models/Coupon");

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
        $addFields: {
          "productDetails.stock": "$productDetails.quantity",
        },
      },
      {
        $project: {
          "productDetails._id": 1,
          "productDetails.productName": 1,
          "productDetails.mrp": 1,
          "productDetails.discount": 1,
          "productDetails.image": {
            $arrayElemAt: ["$productDetails.images", 0],
          }, // Get first image
          "productDetails.offerStartDate": 1,
          "productDetails.offerEndDate": 1,
          "productDetails.stock": 1,
          products: 1,
          userId: 1,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$productDetails", "$products", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          productDetails: 0,
          products: 0,
          userId: 0,
        },
      },
      addFinalPriceStage,
      // to add stock status and subtotal price
      {
        $addFields: {
          stockStatus: {
            $cond: {
              if: { $eq: ["$stock", 0] },
              then: "out",
              else: {
                $cond: {
                  if: { $gt: ["$quantity", "$stock"] },
                  then: "sna",
                  else: "in",
                },
              },
            },
          },
          subTotalPrice: {
            $multiply: ["$finalPrice", "$quantity"],
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
    console.log(products);

    const total = productCount ? productCount.total : 0;
    const hasMore = skip + products.length < total;

    res.status(200).json({ products, total, hasMore });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// to add an an item to cart, product quantity will decrese in products too
// FIXED
exports.addItemToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.product) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ error: "User or product not found in request." });
    }

    const productId = req.product._id;
    const userId = req.user._id;

    let cart = await CartSchema.findOne({ userId }).session(session);

    // if user has no existing cart create one
    if (!cart) {
      cart = new CartSchema({
        userId,
        products: [{ productId, quantity: 1 }],
      });
    } else {
      // check if user already has product in cart
      const existingProduct = cart.products.find((p) =>
        p.productId.equals(productId)
      );
      if (existingProduct) {
        await session.commitTransaction();
        return res.status(200).json({ message: "Product is already in cart" });
      }

      // add the new product to cart
      cart.products.push({ productId, quantity: 1 });
    }

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
// FIXED
exports.increaseCartItemQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.product) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ error: "User or product not found in request." });
    }

    const productId = req.product._id;
    const userId = req.user._id;

    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({
        error: "You have no existing cart! Add an item to cart first",
      });
    }

    // find the requested product from cart
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

    if (productIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({
        error:
          "Product not founded in your cart! Add the product to cart first",
      });
    }

    if (cart.products[productIndex].quantity >= req.product.quantity) {
      await session.abortTransaction();
      return res.status(404).json({
        error: "No stocks left",
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
// FIXED
exports.decreaseCartItemQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.product) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ error: "User or product not found in request." });
    }

    const productId = req.product._id;
    const userId = req.user._id;

    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      await session.abortTransaction();
      return res.status(404).json({
        error: "You have no existing cart! Add an item to cart first",
      });
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
// FIXED
exports.deleteCartItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.body;
    if (!productId) {
      return res
        .status(400)
        .json({ error: "Product not found in request! Select one product" });
    }

    if (!req.user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found in request." });
    }

    const userId = req.user._id;

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
      return total + (item.subTotalPrice || 0);
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

// CHECK OUT PAGE
exports.getCheckoutPage = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const userId = req.user._id;

    const { cart, productId } = req.query;

    if (cart) {
      const userCart = await CartSchema.findOne({ userId });

      if (!cart || userCart.products.length === 0) {
        return res.redirect("/cart");
      }

      req.session.cartCheckout = true;
      req.session.checkoutProductId = null
    } else if (productId) {
      const product = await ProductSchema.findById(productId);

      if (!product) {
        return res.redirect("/cart");
      }

      req.session.checkoutProductId = product._id;
      req.session.cartCheckout = false
    }

    res.render("user/account/checkout");
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).send("Internal Server Error");
  }
};

// return checkout amout , after decreasing discount if it has discount 
exports.getCheckoutAmount = async (req, res, next) => {
  try {

    let toPay

    if (req.session.cartCheckout) {
      toPay = await getCartTotal(req.user._id)
    }else if(req.session.checkoutProductId) {
      product = await getProductWithFinalPrice(req.session.checkoutProductId)
      toPay = product.finalPrice
    }

    let discountAmount = 0;
    if (req.session.appliedCouponId) {
      let coupon = await Coupons.findById(req.session.appliedCouponId);
      if (coupon) {
        discountAmount = (coupon.discount * toPay) / 100;
        toPay -= discountAmount;
      }
    }

    toPay = Math.max(0, toPay);

    res.json({ total: toPay, discountApplied: discountAmount });

  } catch (error) {
    console.log(error)
    next(error)
  }
};

// save changed delivery address to session
exports.chooseDeliveryAddress = async (req, res) => {
  try {
    console.log(req.body);
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ error: "Choose an address" });
    }

    const address = await AddressShema.findById(addressId);

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    req.session.deliveryAddress = addressId;
    res.status(200).json({ message: "Address ID added to session" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCartItemCount = async (req, res, next) => {
  try {
    const loggedInUser = req.session.user;
    if (!loggedInUser) {
      return res.status(200).json({ count: 0 });
    }

    const cart = await CartSchema.findOne({ userId: loggedInUser.id });

    if (!cart) {
      return res.status(200).json({ count: 0 });
    }

    const itemCount = cart.products.length;

    return res.status(200).json({ count: itemCount });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
/*
request body: paymentMethod: "COD" / "Online"
session needed- login
optional session needed - choose address
*/

// to place an order without coupon
exports.placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const userId = req.user._id;
    const { paymentMethod } = req.body;
    const cart = req.cart;

    if (!paymentMethod) {
      return res.status(404).json({ error: "Please choose a payment method." });
    }

    // cart total or total amont payable by user with out coupon discount
    const cartTotal = await getCartTotal(userId);

    // get address id , default address or address choosed from session
    let addressId = req.session.deliveryAddress;
    if (!req.session.deliveryAddress) {
      const address = await AddressShema.findOne(
        { userId: userId, isDefault: true },
        "_id"
      );
      addressId = address ? address._id : null;
    } else {
      const address = await AddressShema.findOne({ _id: addressId }, "_id");
      addressId = address ? address._id : null;
    }

    if (!addressId) {
      return res.status(400).json({ error: "No delivery address found" });
    }

    // decrese the quantity of each product from db
    for (const item of cart.products) {
      const updatedProduct = await decreaseProductQuantity(
        item.productId,
        item.quantity,
        session
      );
      if (!updatedProduct) {
        throw new Error(`Product with ID ${item.productId} is not available`);
      }
    }

    const newOrder = new OrderSchema({
      userId,
      addressId,
      totalAmount: cartTotal,
      totalPayable: cartTotal,
      paymentMethod: 'COD',
    });

    const order = await newOrder.save({ session });
    if (!order) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Faild to place order" });
    }

    // save order items
    const cartItemsDetails = await getUserCartItems(userId);
    console.log("order item details", cartItemsDetails);
    console.log("one order item ", cartItemsDetails[0]);
    const orderItems = cartItemsDetails.map((item) => ({
      orderId: order._id,

      productName: item.productName,
      mrp: item.mrp,
      discount: item.discount,
      image: item.image,
      quantity: item.quantity,
      finalPrice: item.finalPrice,
      subTotalPrice: item.subTotalPrice,
      productId: item.productId,

      isReturnRequested: false,
      isReturned: false,
      returnReason: null,
      returnDate: null,
    }));
    console.log("modifid order items", orderItems);

    const insertedOrderItems = await OrderItem.insertMany(orderItems, {
      session,
    });

    if (insertedOrderItems.length !== orderItems.length) {
      await session.abortTransaction();
      throw new Error("Not all order items were added");
    }

    // delete old cart
    await CartSchema.deleteOne({ userId }, { session });

    await session.commitTransaction();

    res.status(200).json({ message: "Order Placed Successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

exports.getAddAnotherAddressPage = async (req, res) => {
  res.render("user/account/addAnotherAddress");
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
