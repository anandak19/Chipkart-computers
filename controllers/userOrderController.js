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

      if (!cart || userCart?.products.length === 0) {
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
    res.status(500).send("Internal Server Error");
  }
};

// return checkout amout , after decreasing discount if it has discount
exports.getCheckoutAmount = async (req, res, next) => {
  try {
    const checkoutData = await calculateCheckoutAmount(req);
    res.status(200).json(checkoutData);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.applayCoupon = async (req, res, next) => {
  try {

    if (req.session.appliedCouponId) {
      return res.status(404).json({error: "You can only use one coupon is a single order"})
    }

    const {couponCode} = req.body
    if(!couponCode){
      return res.status(400).json({error: "Coupon code needed"})
    }

    const userCoupon = await UserCoupon.findOne({couponCode})

    if (!userCoupon) {
      return res.status(404).json({error: 'You didt have any coupon with this code'})
    }

    const coupon = await Coupons.findOne({couponCode, isActive: true})

    if (!coupon) {
      return res.status(404).json({error: 'Coupon not found'})
    }

    const today = new Date()
    const endDate = new Date(coupon.endDate)

    if (today > endDate) {
      return res.status(400).json({error: 'Coupon validity expired'})
    }

    req.session.appliedCouponId = coupon._id
    userCoupon.isRedeemed = true
    await userCoupon.save()

    res.status(200).json({message: 'Coupon applied successfully'})
    
  } catch (error) {
    console.log(error)
    next(error)
  }
}

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

// to place an order without coupon COD
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

    // if no payment method is choosen
    if (!paymentMethod) {
      return res.status(404).json({ error: "Please choose a payment method." });
    }

    // contains the total payable and discount amount
    const checkoutData = await calculateCheckoutAmount(req);

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
          throw new Error(`Product with ID ${item.productId} is not available`);
        }
      }
    } else if (req.session.checkoutProductId) {
      const updatedProduct = await decreaseProductQuantity(
        cart[0]._id,
        1,
        session
      );
    }

    // create new order
    const newOrder = new OrderSchema({
      userId,
      addressId,
      totalAmount: checkoutData.total + checkoutData.discountApplied,
      totalPayable: checkoutData.total,
      paymentMethod: paymentMethod,
    });

    const order = await newOrder.save({ session });
    if (!order) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Faild to place order" });
    }

    // save order items, if cart-save cart items and delete the cart, if product-save product to orderItems
    if (req.session.cartCheckout) {
      // get cart items with calculated final price
      const cartItemsDetails = await getUserCartItems(userId);
      console.log("order item details", cartItemsDetails);
      console.log("one order item ", cartItemsDetails[0]);
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
      console.log("modifid order items", orderItems);

      const insertedOrderItems = await OrderItem.insertMany(orderItems, {
        session,
      });

      // check if all items in the order where inserted to db
      if (insertedOrderItems.length !== orderItems.length) {
        await session.abortTransaction();
        throw new Error("Not all order items were added");
      }

      // delete old cart
      await CartSchema.deleteOne({ userId }, { session });
    } else if (req.session.checkoutProductId) {
      console.log("single item", cart);
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
    
    req.session.appliedCouponId = null
    res.status(200).json({ message: "Order Placed Successfully", redirectUrl });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// create order to pay using razorpay
exports.createRazorypayOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const cart = req.cart;

    // contains the total payable and discount amount
    const checkoutData = await calculateCheckoutAmount(req);

    // get address id , default address or address choosed from session
    await getDeliveryAddress(req);

    const options = {
      amount: checkoutData.total * 100,
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("razors replay", order);
    await session.commitTransaction();
    res.status(200).json({ order });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
 
exports.varifyPayment = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
      const cart = req.cart;
      const userId = req.user._id;
    console.log(req.body);

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment details received" });
    }


    // Generate expected signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature === razorpay_signature) {
      console.log("Payment Verified Successfully!");

      const checkoutData = await calculateCheckoutAmount(req);
      const addressId = await getDeliveryAddress(req);

      // decrese product from db 
      if (req.session.cartCheckout) {
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
      } else if (req.session.checkoutProductId) {
        const updatedProduct = await decreaseProductQuantity(
          cart[0]._id,
          1,
          session
        );
      }

      // create new order 
      const newOrder = new OrderSchema({
        userId,
        addressId,
        totalAmount: checkoutData.total + checkoutData.discountApplied,
        discount: checkoutData.discountApplied,
        totalPayable: checkoutData.total,
        paymentStatus: "Paid",
        paymentMethod: "Online",
        razorpayPaymentId: razorpay_payment_id
      });

      req.session.appliedCouponId = null
      const order = await newOrder.save({ session });
      if (!order) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Faild to place order" });
      }

          // save order items, if cart-save cart items and delete the cart, if product-save product to orderItems
    if (req.session.cartCheckout) {
      // get cart items with calculated final price
      const cartItemsDetails = await getUserCartItems(userId);
      console.log("order item details", cartItemsDetails);
      console.log("one order item ", cartItemsDetails[0]);
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
      console.log("modifid order items", orderItems);

      const insertedOrderItems = await OrderItem.insertMany(orderItems, {
        session,
      });

      // check if all items in the order where inserted to db
      if (insertedOrderItems.length !== orderItems.length) {
        await session.abortTransaction();
        throw new Error("Not all order items were added");
      }

      // delete old cart
      await CartSchema.deleteOne({ userId }, { session });
    } else if (req.session.checkoutProductId) {
      console.log("single item", cart);
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


    const couponDiscount = await addUserCoupon(order._id, session);

    const redirectUrl = `/account/orders/all/ord/${order._id}`;
    req.session.orderMessage = `Order Placed Successfully`;
    if (couponDiscount) {
      req.session.couponMessage = `Congratulations! You will get a new coupon in this order`;
    }

    await session.commitTransaction();

      res.status(200).json({ message: "Order Placed Successfully", redirectUrl });
    } else {
      console.log("Payment Verification Failed!");
      await session.abortTransaction();
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed!" });
    }
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    res
      .status(500)
      .json({ success: false, message: "Error verifying payment" });
  } finally {
    session.endSession();
  }
};

exports.getAddAnotherAddressPage = async (req, res) => {
  res.render("user/account/address/addAnotherAddress");
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
