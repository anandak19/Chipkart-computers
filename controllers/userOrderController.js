const ProductSchema = require("../models/Product");
const CartSchema = require("../models/Cart");
const UserSchema = require("../models/User");
const AddressShema = require("../models/Address");
const OrderSchema = require("../models/Order");
const OrderItem = require("../models/orderItem");
const mongoose = require("mongoose");
const Coupons = require("../models/Coupon");
const UserCoupon = require("../models/UserCoupon");
const { razorpay } = require("../config/razorpay");
const crypto = require("crypto");
require("dotenv").config();

const {
  decreaseProductQuantity,
  increaseProductQuantity,
} = require("../utils/productQtyManagement");
const { getUserCartItems, getCartTotal } = require("../utils/cartManagement");
const {
  addFinalPriceStage,
  getProductWithFinalPrice,
} = require("../utils/productHelpers");
const {
  calculateCheckoutAmount,
  getDeliveryAddress,
} = require("../utils/sessionUtils");
const { addUserCoupon } = require("../utils/couponsManager");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");

const maxQty = Number(process.env.MAX_QTY);

exports.getCartPage = (req, res) => {
  res.render("user/account/cart");
};

exports.getCartItems = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError("User details not found", STATUS_CODES.BAD_REQUEST);
    }
    const userId = req.user._id;
    const { p } = req.query;
    const page = Number(p) || 0;
    const limit = 5;
    const skip = page * limit;

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

    const total = productCount ? productCount.total : 0;
    const hasMore = skip + products.length < total;

    res.status(STATUS_CODES.SUCCESS).json({ products, total, hasMore });
  } catch (error) {
    next(error);
  }
};

// to add an an item to cart, product quantity will decrese in products too
// FIXED
exports.addItemToCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.product) {
      await session.abortTransaction();
      throw new CustomError(
        "User or product not found in request.",
        STATUS_CODES.BAD_REQUEST
      );
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
        return res
          .status(STATUS_CODES.SUCCESS)
          .json({ message: "Product is already in cart" });
      }

      // add the new product to cart
      cart.products.push({ productId, quantity: 1 });
    }

    await cart.save({ session });
    await session.commitTransaction();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Product added to cart" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// to increase the quantity of the item in the cart
// FIXED
exports.increaseCartItemQuantity = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.product) {
      throw new CustomError(
        "User or product not found in request.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const productId = req.product._id;
    const userId = req.user._id;

    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      throw new CustomError(
        "You have no existing cart! Add an item to cart first",
        STATUS_CODES.NOT_FOUND
      );
    }

    // find the requested product from cart
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

    if (productIndex === -1) {
      throw new CustomError(
        "Product not founded in your cart! Add the product to cart first",
        STATUS_CODES.NOT_FOUND
      );
    }

    if (cart.products[productIndex].quantity >= req.product.quantity) {
      throw new CustomError("No stocks left", STATUS_CODES.CONFLICT);
    }

    // check if the current quantity is greater than limit
    if (cart.products[productIndex].quantity >= maxQty) {
      throw new CustomError(
        `User can add only upto ${maxQty} quantity of item`,
        STATUS_CODES.CONFLICT
      );
    }

    // decrement product quantity from db
    cart.products[productIndex].quantity++;

    await cart.save({ session });
    await session.commitTransaction();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Product incremented" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// to decrease the cart item quantity
// FIXED
exports.decreaseCartItemQuantity = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || !req.product) {
      throw new CustomError(
        "User or product not found in request.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const productId = req.product._id;
    const userId = req.user._id;

    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      throw new CustomError(
        "You have no existing cart! Add an item to cart first",
        STATUS_CODES.NOT_FOUND
      );
    }

    // find the requested product from cart
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

    if (productIndex === -1) {
      throw new CustomError(
        "Product not founded in users cart! Add the product to cart first",
        STATUS_CODES.CONFLICT
      );
    }

    // check if the current quantity is greater than limit
    if (cart.products[productIndex].quantity === 1) {
      throw new CustomError(
        "Minimum 1 one quantity is needed. Try deleting the item to remove from cart",
        STATUS_CODES.CONFLICT
      );
    }

    cart.products[productIndex].quantity--;
    await cart.save({ session });

    await session.commitTransaction();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Product decremented" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// to remove a item from cart
// FIXED
exports.deleteCartItem = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.body;
    if (!productId) {
      throw new CustomError(
        "Product not found in request! Select one product",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }

    const userId = req.user._id;

    // find the cart of user
    let cart = await CartSchema.findOne({ userId }).session(session);

    if (!cart) {
      throw new CustomError("User have no cart.", STATUS_CODES.NOT_FOUND);
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

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Product removed from cart" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// get the cart total prices
exports.getCartTotal = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.BAD_REQUEST
      );
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

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ cartSubTotal, shippingFee, cartTotal });
  } catch (error) {
    next(error);
  }
};

// CHECK OUT PAGE
exports.getCheckoutPage = async (req, res) => {
  try {
    const userId = req.userId;

    const { cart, productId } = req.query;

    if (cart) {
      const userCart = await CartSchema.findOne({ userId });

      if (!cart || userCart?.products.length === 0 || !userCart) {
        console.log(userCart);
        return res.redirect("/cart");
      }

      req.session.cartCheckout = true;
      req.session.checkoutProductId = null;
    } else if (productId) {
      const product = await ProductSchema.findById(productId);

      if (!product) {
        return res.redirect("/cart");
      }

      req.session.checkoutProductId = product._id;
      req.session.cartCheckout = false;
    }

    res.render("user/account/orders/checkout");
  } catch (error) {
    console.error("Error fetching checkout:", error);
    return res.redirect("/cart");
  }
};

// return checkout amout , after decreasing discount if it has discount
exports.getCheckoutAmount = async (req, res, next) => {
  try {
    const checkoutData = await calculateCheckoutAmount(req);
    if (!checkoutData) {
      throw new CustomError(
        "Faild to fetch check out amount",
        STATUS_CODES.NOT_FOUND
      );
    }
    res.status(STATUS_CODES.SUCCESS).json(checkoutData);
  } catch (error) {
    next(error);
  }
};

// get the applicable coupon
exports.getApplicableCoupons = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      throw new CustomError("User details not found", STATUS_CODES.NOT_FOUND);
    }

    const checkoutData = await calculateCheckoutAmount(req);
    if (!checkoutData) {
      throw new CustomError(
        "Faild to fetch check out amount",
        STATUS_CODES.NOT_FOUND
      );
    }
    const totalPayable = checkoutData.totalPayable;

    // Fetch used coupons by the user
    const usedCoupons = await UserCoupon.find({ userId }).lean();
    const usedCouponIds = usedCoupons.map(
      (doc) => new mongoose.Types.ObjectId(doc.couponId)
    );

    // Fetch available coupons
    const availableCoupons = await Coupons.aggregate([
      {
        $match: {
          _id: { $nin: usedCouponIds },
          minOrderAmount: { $lte: totalPayable },
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          isActive: true,
        },
      },
      { 
        $sort: { discount: -1 } 
      }
    ]);


    res.status(200).json({ availableCoupons });
  } catch (error) {
    next(error);
  }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }
    if (req.session.appliedCouponId) {
      throw new CustomError(
        "You can only use single coupon in an order",
        STATUS_CODES.CONFLICT
      );
    }

    const { couponCode } = req.body;
    if (!couponCode) {
      throw new CustomError("Coupon code needed", STATUS_CODES.BAD_REQUEST);
    }

    // check if user has used this coupon
    const userCoupon = await UserCoupon.findOne({
      userId: user._id,
      couponCode,
    });

    if (userCoupon) {
      throw new CustomError(
        "You have alredy redeemed this coupon",
        STATUS_CODES.CONFLICT
      );
    }

    // check if this coupon exists
    const coupon = await Coupons.findOne({ couponCode, isActive: true });
    if (!coupon) {
      throw new CustomError("Coupon not found", STATUS_CODES.NOT_FOUND);
    }

    // check if the coupon has expired or not
    const today = new Date();
    const endDate = new Date(coupon.endDate);
    if (today > endDate) {
      throw new CustomError(
        "Coupon has expired expired",
        STATUS_CODES.BAD_REQUEST
      );
    }

    req.session.appliedCouponId = coupon._id;

    const newUserCoupon = new UserCoupon({
      userId: user._id,
      couponCode,
      couponId: coupon._id,
    });
    await newUserCoupon.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Coupon applied successfully" });
  } catch (error) {
    next(error);
  }
};

exports.removeAppliedCoupon = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const couponId = req.session.appliedCouponId;
    if (!userId || !couponId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }

    const coupon = await Coupons.findById(couponId);
    if (!coupon) {
      throw new CustomError(
        "Applied coupon was not found",
        STATUS_CODES.NOT_FOUND
      );
    }

    const userCoupon = await UserCoupon.findOneAndDelete({
      couponCode: coupon.couponCode,
      userId: userId,
    });

    if (!userCoupon) {
      throw new CustomError(
        "You didn't use any coupon with this code",
        STATUS_CODES.NOT_FOUND
      );
    }

    req.session.appliedCouponId = null;

    res.status(STATUS_CODES.SUCCESS).json({ message: "Coupon removed" });
  } catch (error) {
    next(error);
  }
};

// save changed delivery address to session
exports.chooseDeliveryAddress = async (req, res, next) => {
  try {
    const { addressId } = req.body;

    if (!addressId) {
      throw new CustomError("Choose an address", STATUS_CODES.BAD_REQUEST);
    }

    const address = await AddressShema.findById(addressId);

    if (!address) {
      throw new CustomError("Address not found", STATUS_CODES.NOT_FOUND);
    }

    req.session.deliveryAddress = addressId;
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Address ID added to session" });
  } catch (error) {
    next(error);
  }
};

exports.getCartItemCount = async (req, res, next) => {
  try {
    const loggedInUser = req.session.user;
    if (!loggedInUser) {
      return res.status(STATUS_CODES.SUCCESS).json({ count: 0 });
    }

    const cart = await CartSchema.findOne({ userId: loggedInUser.id });

    if (!cart) {
      return res.status(STATUS_CODES.SUCCESS).json({ count: 0 });
    }

    const itemCount = cart.products.length;

    return res.status(STATUS_CODES.SUCCESS).json({ count: itemCount });
  } catch (error) {
    next(error);
  }
};
/*
request body: paymentMethod: "COD" / "Online"
session needed- login
optional session needed - choose address
*/

// to place an order without coupon COD
exports.placeOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const userId = req.user._id;
    const { paymentMethod } = req.body;
    const cart = req.cart;
    let isFirstOrder = false;
    let isPaid = false;

    // if no payment method is choosen
    if (!paymentMethod) {
      throw new CustomError(
        "Please choose a payment method.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const checkoutData = await calculateCheckoutAmount(req);

    if (paymentMethod === "COD") {
      if (checkoutData.totalPayable > 5000) {
        throw new CustomError(
          "Orders above ₹5000 are not allowed for COD ",
          STATUS_CODES.BAD_REQUEST
        );
      }
    } else if (paymentMethod === "Wallet") {
      // check if the wallet amount is less than the totalPayable. if true return error
      const userWallet = await Wallet.findOne({ userId }).session(session);
      if (!userWallet) {
        throw new CustomError("Wallet not found", STATUS_CODES.NOT_FOUND);
      }

      if (
        userWallet.balanceLeft === 0 ||
        userWallet.balanceLeft < checkoutData.totalPayable
      ) {
        throw new CustomError(
          "Insufficient balance in wallet! Try another method",
          STATUS_CODES.BAD_REQUEST
        );
      }

      userWallet.balanceLeft -= checkoutData.totalPayable;
      await userWallet.save({ session });

      const newTransaction = new WalletTransaction({
        userId,
        userWalletId: userWallet._id,
        amount: checkoutData.totalPayable,
        transactionType: "debit",
        reason: "Used Wallet Payment",
      });

      await newTransaction.save({ session });
      isPaid = true;
    } else {
      throw new CustomError(
        "Please choose a valid payment method",
        STATUS_CODES.BAD_REQUEST
      );
    }

    // get address id , default address or address choosed from session
    const addressId = await getDeliveryAddress(req);

    // decrese the quantity of each product or selected product from db
    if (req.session.cartCheckout) {
      for (const item of cart.products) {
        const updatedProduct = await decreaseProductQuantity(
          item.productId,
          item.quantity,
          session
        );
        if (!updatedProduct) {
          throw new CustomError(
            `Product with ID ${item.productId} is not available`,
            STATUS_CODES.CONFLICT
          );
        }
      }
    } else if (req.session.checkoutProductId) {
      const updatedProduct = await decreaseProductQuantity(
        cart[0]._id,
        1,
        session
      );
    }

    // check if this is first order of referd user
    const user = await UserSchema.findById(userId).session(session);
    if (user && user.refBy && !user.isFirstOrderDone) {
      isFirstOrder = true;
      user.isFirstOrderDone = true;
      await user.save({ session });
    }

    // create new order
    const newOrder = new OrderSchema({
      userId,
      addressId,
      totalAmount: checkoutData.total,
      shippingFee: checkoutData.shippingFee,
      discount: checkoutData.discountApplied,
      totalPayable: checkoutData.totalPayable,
      paymentStatus: isPaid ? "Paid" : "Pending",
      paymentMethod: paymentMethod,
      isFirstOrder: isFirstOrder,
    });

    const order = await newOrder.save({ session });

    if (!order) {
      throw new CustomError("Faild to place order", STATUS_CODES.BAD_REQUEST);
    }

    // save order items, if cart-save cart items and delete the cart, if product-save product to orderItems
    if (req.session.cartCheckout) {
      // get cart items with calculated final price
      const cartItemsDetails = await getUserCartItems(userId);
      // create each order items with follwing field
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
      }));

      const insertedOrderItems = await OrderItem.insertMany(orderItems, {
        session,
      });

      // check if all items in the order where inserted to db
      if (insertedOrderItems.length !== orderItems.length) {
        throw new CustomError(
          "Not all order items were added",
          STATUS_CODES.CONFLICT
        );
      }

      // delete old cart
      await CartSchema.deleteOne({ userId }, { session });
    } else if (req.session.checkoutProductId) {
      const newOrderItem = new OrderItem({
        orderId: order._id,
        productName: cart[0].productName,
        mrp: cart[0].mrp,
        discount: cart[0].discount,
        image: cart[0].images[0],
        quantity: 1,
        finalPrice: checkoutData.total,
        subTotalPrice: checkoutData.total,
        productId: cart[0]._id,
      });

      await newOrderItem.save({ session });
    }

    // check if the user got any discount coupon in this order
    const couponDiscount = await addUserCoupon(order._id, session);

    const redirectUrl = `/account/orders/all/ord/${order._id}`;
    req.session.orderMessage = `Order Placed Successfully`;
    if (couponDiscount) {
      req.session.couponMessage = `Congratulations! You will get a new coupon in this order`;
    }

    await session.commitTransaction();

    req.session.appliedCouponId = null;
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Order Placed Successfully", redirectUrl });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// create order to pay using razorpay
exports.createRazorypayOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }

    const cart = req.cart;

    // contains the total payable and discount amount
    const checkoutData = await calculateCheckoutAmount(req);

    // get address id , default address or address choosed from session
    await getDeliveryAddress(req);

    const options = {
      amount: checkoutData.totalPayable * 100,
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    await session.commitTransaction();
    res.status(STATUS_CODES.SUCCESS).json({ order });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// varify payment
// create the order / if payment is sucess place the order
exports.varifyPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      success,
    } = req.body;
    const cart = req.cart;
    const userId = req.user._id;

    let redirectUrl;
    let isPaymentSuccess = false;

    let responseStatus = STATUS_CODES.BAD_REQUEST;
    let responseMessage = "Payment failed!";

    // init "currentOrder"
    let currentOrder;
    const razorpayResponse = await razorpay.payments.fetch(razorpay_payment_id);

    if (success) {
      // 1. varify the order with the generated key and given key
      // Generate expected signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const expectedSignature = hmac.digest("hex");

      if (expectedSignature !== razorpay_signature) {
        responseMessage = "Payment Verification Failed!";
      } else {
        isPaymentSuccess = true;
        responseStatus = STATUS_CODES.SUCCESS;
        responseMessage = "Payment successful";
      }
    }

    // from the orders database check if their is a order with razorpay_order_id exists
    currentOrder = await OrderSchema.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    // new order create
    if (!currentOrder) {
      const checkoutData = await calculateCheckoutAmount(req);
      const addressId = await getDeliveryAddress(req);

      let isFirstOrder = false;
      const user = await UserSchema.findById(userId).session(session);
      if (user && user.refBy && !user.isFirstOrderDone) {
        isFirstOrder = true;
        user.isFirstOrderDone = true;
        await user.save({ session });
      }

      // if not create a new order (include razorpay_order_id) and order items as pending status - save each order items to db
      const newOrder = new OrderSchema({
        userId,
        addressId,
        totalAmount: checkoutData.total,
        shippingFee: checkoutData.shippingFee,
        discount: checkoutData.discountApplied,
        totalPayable: checkoutData.totalPayable,
        paymentStatus: isPaymentSuccess ? "Paid" : "Pending",
        paymentMethod: "Online",
        razorpayPaymentMethod: razorpayResponse.method,

        orderStatus: isPaymentSuccess ? "Ordered" : "Pending",
        razorpayPaymentId: success ? razorpay_payment_id : null,
        razorpayOrderId: razorpay_order_id,
        isFirstOrder,
      });

      currentOrder = await newOrder.save({ session });

      // if order creation faild
      if (!currentOrder) {
        throw new CustomError("Faild to place order", STATUS_CODES.BAD_REQUEST);
      }

      // create new order item(s) and save to db
      if (req.session.cartCheckout) {
        // get cart items with calculated final price
        const cartItemsDetails = await getUserCartItems(userId);
        // create each order items with follwing field
        const orderItems = cartItemsDetails.map((item) => ({
          orderId: currentOrder._id,
          productName: item.productName,
          mrp: item.mrp,
          discount: item.discount,
          image: item.image,
          quantity: item.quantity,
          finalPrice: item.finalPrice,
          subTotalPrice: item.subTotalPrice,
          productId: item.productId,
          orderStatus: isPaymentSuccess ? "Ordered" : "Pending",
        }));

        // save all order items from cart to db
        const insertedOrderItems = await OrderItem.insertMany(orderItems, {
          session,
        });

        // check if all items in the order where inserted to db
        if (insertedOrderItems.length !== orderItems.length) {
          throw new CustomError(
            "Not all order items were added",
            STATUS_CODES.BAD_REQUEST
          );
        }

        // delete old cart
        await CartSchema.deleteOne({ userId }, { session });
      } else if (req.session.checkoutProductId) {
        const newOrderItem = new OrderItem({
          orderId: currentOrder._id,
          productName: cart[0].productName,
          mrp: cart[0].mrp,
          discount: cart[0].discount,
          image: cart[0].images[0],
          quantity: 1,
          finalPrice: checkoutData.total,
          subTotalPrice: checkoutData.total,
          productId: cart[0]._id,
          orderStatus: isPaymentSuccess ? "Ordered" : "Pending",
        });

        await newOrderItem.save({ session });
      }
    }

    redirectUrl = `/account/orders/all/ord/${currentOrder._id}`;
    req.session.orderErrorMessage = "Please Retry payment";

    if (isPaymentSuccess) {
      // decrease the quantity of items from the db
      // decrese product from db - cart products if car/ selected products
      if (req.session.cartCheckout) {
        for (const item of cart.products) {
          const updatedProduct = await decreaseProductQuantity(
            item.productId,
            item.quantity,
            session
          );
          if (!updatedProduct) {
            throw new CustomError(
              `Product with ID ${item.productId} is not available`,
              STATUS_CODES.BAD_REQUEST
            );
          }
        }
      } else if (req.session.checkoutProductId) {
        const updatedProduct = await decreaseProductQuantity(
          cart[0]._id,
          1,
          session
        );

        if (!updatedProduct) {
          throw new CustomError(
            `Product is not available`,
            STATUS_CODES.BAD_REQUEST
          );
        }
      }

      const couponDiscount = await addUserCoupon(currentOrder._id, session);

      req.session.orderMessage = `Order Placed Successfully`;
      req.session.orderErrorMessage = null;

      if (couponDiscount) {
        req.session.couponMessage = `Congratulations! You will get a new coupon in this order`;
      }

      responseMessage = "Order Placed Successfully";
      responseStatus = STATUS_CODES.SUCCESS;
    }

    await session.commitTransaction();
    return res
      .status(responseStatus)
      .json({ message: responseMessage, redirectUrl: redirectUrl || null });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.getAddAnotherAddressPage = async (req, res) => {
  res.render("user/account/address/addAnotherAddress");
};
