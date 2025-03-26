const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const Order = require("../models/Order");
const AddressSchema = require("../models/Address");
const OrderItem = require("../models/orderItem");
const UserCoupon = require("../models/UserCoupon");
const UserSchema = require("../models/User");
const Coupons = require("../models/Coupon");

const logoutUser = require("../utils/logoutUser");
const {
  getOrderItemsDetails,
  cancelOrder,
  getFullOrderDetails,
} = require("../utils/orderManagement");
const {
  validateDob,
  validateName,
  validatePhoneNumber,
  validateEmail,
  validatePassword,
} = require("../utils/validations");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { decreaseProductQuantity } = require("../utils/productQtyManagement");
const { addUserCoupon } = require("../utils/couponsManager");
const { razorpay } = require("../config/razorpay");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");
const Product = require("../models/Product");

// make a session validate middleware later that sends json response

// PERSONAL DETAILS
// render personal details page
exports.getAccount = (req, res) => {
  res.render("user/account/userAccount", { currentPage: "account" });
};

// get users details
exports.getUserDetails = async (req, res, next) => {
  try {
    const userId = req.session.user.id;

    const user = await UserSchema.findById(userId);

    if (!user) {
      throw new CustomError("Product not found", STATUS_CODES.NOT_FOUND);
    }

    res.status(STATUS_CODES.SUCCESS).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dob: user.dob,
      referralCode: user.referralCode,
      baseUrl: process.env.BASE_URL,
    });
  } catch (error) {
    next(error);
  }
};

// post updated users details
exports.postUserDetails = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const user = await UserSchema.findById(userId);

    if (!user) {
      throw new CustomError("User not found", STATUS_CODES.NOT_FOUND);
    }

    let { name, phoneNumber, dob } = req.body;
    if (!name || !phoneNumber || !dob) {
      throw new CustomError(
        "All fields are required",
        STATUS_CODES.BAD_REQUEST
      );
    }

    name = name.trim();
    phoneNumber = phoneNumber.trim();
    dob = dob.trim();

    let errorMessage = validateName(name) || validateDob(dob);
    if (errorMessage) {
      throw new CustomError(errorMessage, STATUS_CODES.BAD_REQUEST);
    }

    let refresh = false;

    if (user.phoneNumber !== phoneNumber) {
      errorMessage = await validatePhoneNumber(phoneNumber);
      if (errorMessage) {
        throw new CustomError(errorMessage, STATUS_CODES.BAD_REQUEST);
      }
    }

    user.name = name;
    user.phoneNumber = phoneNumber;
    user.dob = dob;

    await user.save();

    req.session.user = {
      email: user.email,
      id: user._id,
      name: user.name,
    };

    if (refresh) {
      await logoutUser(req, res);
    }

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "User details updated successfully", refresh });
  } catch (error) {
    next(error);
  }
};

exports.postChangePassword = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new CustomError(
        "All fields are required.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      throw new CustomError("User not found.", STATUS_CODES.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new CustomError(
        "Old password is incorrect.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const errorMessage = validatePassword(newPassword, confirmPassword);

    if (errorMessage) {
      throw new CustomError(errorMessage, STATUS_CODES.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    await logoutUser(req, res);
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

// DELIVERY ADDRESS
exports.getAddresses = (req, res) => {
  res.render("user/account/address/userAddress", { currentPage: "address" });
};

exports.getAddressForm = (req, res) => {
  res.render("user/account/address/newAddress", { currentPage: "address" });
};

// add new address
exports.addAddress = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }
    const {
      addressType,
      fullName,
      phoneNumber,
      addressLine,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    if (isDefault) {
      await AddressSchema.findOneAndUpdate(
        { userId: req.user._id, isDefault: true },
        { isDefault: false },
        { new: true }
      );
    }

    const newAddress = new AddressSchema({
      addressType,
      fullName,
      phoneNumber,
      addressLine,
      city,
      state,
      pincode,
      country,
      isDefault,
      userId: req.user._id,
    });

    await newAddress.save();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Address added successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getEditAddressPage = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.redirect("/account/address");
  }
  req.session.editAddressId = id;
  res.render("user/account/address/editAddress", { currentPage: "address" });
};

exports.getAddressDetails = async (req, res, next) => {
  try {
    const addressId = req.session.editAddressId;
    if (!addressId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }

    const addressDetails = await AddressSchema.findById(addressId);
    if (!addressDetails) {
      throw new CustomError("Addresss Not found", STATUS_CODES.BAD_REQUEST);
    }

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Address fetched successfully", addressDetails });
  } catch (error) {
    next(error);
  }
};

// delete a address
exports.deleteAddress = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }

    const { id } = req.params;

    const result = await AddressSchema.deleteOne({
      _id: id,
      userId: req.user._id,
    });

    if (result.deletedCount === 1) {
      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: "Successfully deleted address." });
    } else {
      throw new CustomError(
        "Requested address is not found!",
        STATUS_CODES.NOT_FOUND
      );
    }
  } catch (error) {
    next(error);
  }
};

// save updated address
exports.saveEditedAddress = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }

    const addressId = req.session.editAddressId;

    if (!addressId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }

    const {
      addressType,
      fullName,
      phoneNumber,
      addressLine,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    let address = await AddressSchema.findOne({
      _id: addressId,
      userId: req.user._id,
    });

    if (!address) {
      throw new CustomError("Address not found.", STATUS_CODES.NOT_FOUND);
    }

    if (isDefault) {
      await AddressSchema.updateMany(
        { userId: req.user._id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    // Update the address fields
    address.addressType = addressType || address.addressType;
    address.fullName = fullName || address.fullName;
    address.phoneNumber = phoneNumber || address.phoneNumber;
    address.addressLine = addressLine || address.addressLine;
    address.city = city || address.city;
    address.state = state || address.state;
    address.pincode = pincode || address.pincode;
    address.country = country || address.country;
    address.isDefault = isDefault ?? address.isDefault;

    await address.save();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Address updated successfully" });
  } catch (error) {
    next(error);
  }
};

// toggle adders default or not
exports.toggleAddress = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }

    const { id } = req.params;

    let address = await AddressSchema.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!address) {
      throw new CustomError("Address not found.", STATUS_CODES.NOT_FOUND);
    }

    // If the current address is not default, find the existing default address and update it
    if (!address.isDefault) {
      await AddressSchema.updateMany(
        { userId: req.user._id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    // Toggle isDefault for the selected address
    address.isDefault = !address.isDefault;

    await address.save();

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Address updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// get all address of user
exports.getUsersAllAddress = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        "User not found in request.",
        STATUS_CODES.NOT_FOUND
      );
    }

    const addressArray = await AddressSchema.find({ userId: req.user._id });

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Address fetched successfully", data: addressArray });
  } catch (error) {
    next(error);
  }
};

// ORDER HISTORY
exports.getOrderHistory = (req, res) => {
  res.render("user/account/orders/orderHistory", { currentPage: "orders" });
};

exports.getAllOrders = async (req, res, next) => {
  try {
    // find all the orders of user
    const userId = req.user._id;
    let { page } = req.query;
    page = page ? Number(page) : 0;
    let limit = 3;
    let skip = page * limit;

    const pipeline = [
      {
        $match: { userId: userId },
      },
      {
        $addFields: {
          addressObjId: { $toObjectId: "$addressId" },
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "addressObjId",
          foreignField: "_id",
          as: "addressDetails",
        },
      },
      {
        $unwind: { path: "$addressDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
      {
        $facet: {
          paginatedResult: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const orders = await Order.aggregate(pipeline);

    const paginatedResults = orders[0].paginatedResult;
    const totalCount =
      orders[0].totalCount.length > 0 ? orders[0].totalCount[0].count : 0;

    const hasMore = skip + paginatedResults.length < totalCount;

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, orders: paginatedResults, hasMore });
  } catch (error) {
    next(error);
  }
};

exports.getOrderDetaillsPage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.redirect("/account/orders");
    }

    const orderDetails = await Order.findById(id);
    if (!orderDetails) {
      res.redirect("/account/orders");
    }

    req.session.ordId = orderDetails._id;
    const orderMessage = req.session.orderMessage || null;
    const orderErrorMessage = req.session.orderErrorMessage || null;
    const couponMessage = req.session.couponMessage || null;

    delete req.session.orderMessage;
    delete req.session.couponMessage;
    delete req.session.orderErrorMessage;

    res.render("user/account/orders/orderDetails", {
      currentPage: "orders",
      orderDetails,
      orderMessage,
      couponMessage,
      orderErrorMessage,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/account/orders");
  }
};

exports.getDeliveryInfo = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }
    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomError("Order not found", STATUS_CODES.NOT_FOUND);
    }

    const address = await AddressSchema.findById(order.addressId);
    if (!address) {
      throw new CustomError("Address not found", STATUS_CODES.NOT_FOUND);
    }

    res.status(STATUS_CODES.SUCCESS).json({ address });
  } catch (error) {
    next(error);
  }
};

exports.getRewards = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }
    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomError("Order not found", STATUS_CODES.NOT_FOUND);
    }

    const userCoupon = await UserCoupon.findOne({ orderId: orderId });

    if (!userCoupon) {
      throw new CustomError(
        "No coupons credited in this order",
        STATUS_CODES.NOT_FOUND
      );
    }

    let message;
    if (!userCoupon.isRedeemed && !userCoupon.isCredited) {
      message = "Coupon will credited to you at the time of delivery";
    } else if (!userCoupon.isRedeemed && userCoupon.isCredited) {
      message = "View My Coupons to view your coupon code";
    } else if (userCoupon.isRedeemed && userCoupon.isCredited) {
      message = "You have used this coupon";
    } else {
      message = "Congrats! Keep Shoping";
    }

    const coupon = await Coupons.findOne({ couponCode: userCoupon.couponCode });

    if (!coupon) {
      throw new CustomError("Coupon not found", STATUS_CODES.NOT_FOUND);
    }

    const { discount } = coupon;

    res.status(STATUS_CODES.SUCCESS).json({ message, discount });
  } catch (error) {
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }
    const orderDetails = await getFullOrderDetails(orderId);

    // Render EJS Template
    const templatePath = path.join(
      __dirname,
      "../views/user/account/orders/invoicePdf.ejs"
    );
    const html = await ejs.renderFile(templatePath, {
      orderDetails,
    });

    console.log("Generated HTML successfully!");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      executablePath: puppeteer.executablePath(),
      headless: "new",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    // Generate PDF (No Local Saving)
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    // Send PDF to Client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.end(pdfBuffer); // Correctly sends binary data
  } catch (error) {
    next(error);
  }
};

exports.createRetryPaymentOrder = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }
    const selectedOrder = await Order.findById(orderId);
    if (!selectedOrder) {
      throw new CustomError("Order not found", STATUS_CODES.NOT_FOUND);
    }

    // if amount is paid, return error
    if (selectedOrder.paymentStatus === "Paid") {
      throw new CustomError(
        "You already paid for this order",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const orderItems = await OrderItem.find({ orderId: selectedOrder._id });

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new CustomError(
          `Product with ID ${item.productId} not found`,
          STATUS_CODES.NOT_FOUND
        );
      }

      if (!product.isListed) {
        throw new CustomError(
          `This item is currently unavailable: ${product.productName}`,
          STATUS_CODES.GONE
        );
      }

      if (product.quantity < item.quantity) {
        throw new CustomError(
          `Not enough stock for ${product.productName}. Available: ${product.quantity}`,
          STATUS_CODES.BAD_REQUEST
        );
      }
    }

    // create razorpay order with amount
    const options = {
      amount: selectedOrder.totalPayable * 100,
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);

    res.status(STATUS_CODES.SUCCESS).json({ order });
  } catch (error) {
    next(error);
  }
};

exports.varifyRetryPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      success,
    } = req.body;

    let responseStatus = STATUS_CODES.BAD_REQUEST;
    let responseMessage = "Payment failed!";
    let couponMessage;

    const orderId = req.session.ordId;
    if (!orderId) {
      await session.abortTransaction();
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }

    // get the order
    const selectedOrder = await Order.findById(orderId).session(session);
    if (!selectedOrder) {
      await session.abortTransaction();
      throw new CustomError("Order not found", STATUS_CODES.NOT_FOUND);
    }

    // get razorpay response on order
    const razorpayResponse = await razorpay.payments.fetch(razorpay_payment_id);

    // if payment is success from frontend
    if (success) {
      // varify the signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const expectedSignature = hmac.digest("hex");

      if (expectedSignature !== razorpay_signature) {
        responseMessage = "Payment Verification Failed!";
      } else {
        // if the payment is varified successfully
        responseStatus = STATUS_CODES.SUCCESS;
        responseMessage = "Payment successful";

        // update order
        selectedOrder.orderStatus = "Ordered";
        selectedOrder.paymentStatus = "Paid";
        selectedOrder.razorpayPaymentMethod = razorpayResponse.method;
        selectedOrder.razorpayPaymentId = razorpay_payment_id;
        selectedOrder.razorpayOrderId = razorpay_order_id;

        await selectedOrder.save({ session });

        // Decrease product quantity from DB
        const orderItems = await OrderItem.find({
          orderId: selectedOrder._id,
        }).session(session);

        if (!orderItems || orderItems.length === 0) {
          throw new CustomError(
            "No order items found.",
            STATUS_CODES.NOT_FOUND
          );
        }

        for (const item of orderItems) {
          item.orderStatus = "Ordered";
          await item.save({ session });

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

        // Check and credit coupon to user
        const couponDiscount = await addUserCoupon(selectedOrder._id, session);
        if (couponDiscount) {
          couponMessage =
            "Congratulations! You will get a new coupon in this order";
        }
      }
    }

    await session.commitTransaction();
    return res
      .status(responseStatus)
      .json({ message: responseMessage, couponMessage: couponMessage || null });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// need to test
exports.getOrderItems = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }
    const orderItems = await OrderItem.find({ orderId: orderId });

    if (!orderItems) {
      throw new CustomError("Order items not found", STATUS_CODES.NOT_FOUND);
    }

    res.status(STATUS_CODES.SUCCESS).json({ items: orderItems });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrderByUser = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;

    if (!cancelReason) {
      throw new CustomError("Provide a valid reason", STATUS_CODES.BAD_REQUEST);
    }

    const orderId = req.session.ordId;
    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }

    const orderItems = await OrderItem.find({orderId})
    for(const item of orderItems) {
      const product = await Product.findById(item.productId)
      if(product.quantity < 5) {

      }else {
        await cancelOrder(orderId, cancelReason);
      }
      
    }
    // call the cancel order method here
    

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Order cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getReturnProductPage = async (req, res) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      return redirect("/account/orders");
    }

    const items = await OrderItem.find({
      orderId: orderId,
      returnStatus: { $eq: "none" },
    });

    if (!items) {
      return redirect(`/account/orders/all/ord/${orderId}`);
    }

    res.render("user/account/orders/returnProduct", {
      currentPage: "orders",
      items,
    });
  } catch (error) {
    console.log(error);
    return redirect("/account/orders");
  }
};

exports.returnSelectedProducts = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;

    if (!orderId) {
      throw new CustomError("Session expired", STATUS_CODES.BAD_REQUEST);
    }

    const order = await Order.findById(orderId);

    if (order.orderStatus !== "Delivered") {
      throw new CustomError("Order Is not yet deliverd", STATUS_CODES.CONFLICT);
    }

    const today = new Date();
    const deliveryDate = new Date(order.deliveryDate);

    const differenceInTime = today - deliveryDate;
    const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

    if (differenceInDays > 10) {
      throw new CustomError(
        "You can no longer return this product, since the 10-day return duration has exceeded.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const items = await OrderItem.find({ orderId: orderId });

    if (!items) {
      throw new CustomError("Order Items not found", STATUS_CODES.NOT_FOUND);
    }

    const { productIds, returnReson } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new CustomError(
        "Choose the items you want to return",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (!returnReson) {
      throw new CustomError(
        "Please provide a reason for returning",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));

    const result = await OrderItem.updateMany(
      { orderId: orderId, productId: { $in: objectIds } },
      {
        $set: {
          returnStatus: "requested",
          returnReason: returnReson,
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new CustomError(
        "No matching products found in order. Request faild",
        STATUS_CODES.NOT_FOUND
      );
    }

    const redirectUrl = `/account/orders/all/ord/${orderId}`;

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, message: "Return request send", redirectUrl });
  } catch (error) {
    next(error);
  }
};

// WALLET
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.redirect("/account");
    }

    res.render("user/account/wallet", { currentPage: "wallet", wallet });
  } catch (error) {
    res.redirect("/account");
  }
};

exports.getAllWalletTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Number(req.query.page) || 0;
    const limit = 5;
    const skip = page * limit;

    if (!userId) {
      throw new CustomError("Error geting user", STATUS_CODES.BAD_REQUEST);
    }

    const result = await WalletTransaction.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const paginatedResult = result[0].paginatedResult;
    const totalCount =
      result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

    const hasMore = skip + paginatedResult.length < totalCount;
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, transactions: paginatedResult, hasMore });
  } catch (error) {
    next(error);
  }
};

// COUPONS
exports.getCoupons = (req, res) => {
  res.render("user/account/coupons", { currentPage: "coupons" });
};

exports.getAllUserCoupons = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const userCoupons = await UserCoupon.aggregate([
      {
        $match: { userId: userId, isRedeemed: false, isCredited: true },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponCode",
          foreignField: "couponCode",
          as: "couponDetails",
        },
      },
      {
        $unwind: "$couponDetails",
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$$ROOT", "$couponDetails"] },
        },
      },
      {
        $project: {
          couponDetails: 0,
        },
      },
    ]);

    if (!userCoupons) {
      throw new CustomError(
        "Faild to get the user coupons",
        STATUS_CODES.BAD_REQUEST
      );
    }

    res.status(STATUS_CODES.SUCCESS).json({ userCoupons });
  } catch (error) {
    next(error);
  }
};
