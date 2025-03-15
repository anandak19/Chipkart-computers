const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
require('dotenv').config()

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

// make a session validate middleware later that sends json response

// PERSONAL DETAILS
// render personal details page
exports.getAccount = (req, res) => {
  res.render("user/account/userAccount", { currentPage: "account" });
};

// get users details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(process.env.BASE_URL)
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dob: user.dob,
      referralCode: user.referralCode,
      baseUrl: process.env.BASE_URL
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// post updated users details
exports.postUserDetails = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await UserSchema.findById(userId);
    console.log("user id: ", userId);
    console.log("Requested body: ", req.body);
    console.log("requested user :", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let { name, phoneNumber, dob } = req.body;
    if (!name || !phoneNumber || !dob) {
      return res.status(400).json({ error: "All fields are required" });
    }

    name = name.trim();
    phoneNumber = phoneNumber.trim();
    dob = dob.trim();

    let errorMessage = validateName(name) || validateDob(dob);
    if (errorMessage) {
      console.log("Error in name or dob: ", errorMessage);
      return res.status(400).json({ error: errorMessage });
    }

    let refresh = false;

    if (user.phoneNumber !== phoneNumber) {
      errorMessage = await validatePhoneNumber(phoneNumber);
      if (errorMessage) {
        console.log("Error in phone: ", errorMessage);
        return res.status(400).json({ error: errorMessage });
      }
    }

    user.name = name;
    user.phoneNumber = phoneNumber;
    user.dob = dob;

    await user.save();
    console.log(user);

    req.session.user = {
      email: user.email,
      id: user._id,
      name: user.name,
    };

    if (refresh) {
      await logoutUser(req, res);
    }

    return res
      .status(200)
      .json({ message: "User details updated successfully", refresh });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postChangePassword = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    console.log("REq body: ", req.body);
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect." });
    }

    const errorMessage = validatePassword(newPassword, confirmPassword);

    if (errorMessage) {
      return res.status(400).json({ error: errorMessage });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    await logoutUser(req, res);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
// ------------------------------------

// DELIVERY ADDRESS
exports.getAddresses = (req, res) => {
  res.render("user/account/address/userAddress", { currentPage: "address" });
};

exports.getAddressForm = (req, res) => {
  res.render("user/account/address/newAddress", { currentPage: "address" });
};

// add new address
exports.addAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
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

    console.log(newAddress);
    return res.status(200).json({ message: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getEditAddressPage = async (req, res) => {
  const { id } = req.params;
  req.session.editAddressId = id;
  res.render("user/account/address/editAddress", { currentPage: "address" });
};

exports.getAddressDetails = async (req, res) => {
  try {
    const addressId = req.session.editAddressId;
    if (!addressId) {
      return res.status(400).json({ error: "Session expired" });
    }

    const addressDetails = await AddressSchema.findById(addressId);
    if (!addressDetails) {
      return res.status(400).json({ error: "Addresss Not found" });
    }

    res
      .status(200)
      .json({ message: "Address fetched successfully", addressDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// delete a address
exports.deleteAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const { id } = req.params;

    const result = await AddressSchema.deleteOne({
      _id: id,
      userId: req.user._id,
    });

    if (result.deletedCount === 1) {
      return res.status(200).json({ message: "Successfully deleted address." });
    } else {
      return res.status(404).json({
        error: "No documents matched the query. Deleted 0 documents..",
      });
    }
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// save updated address
exports.saveEditedAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const addressId = req.session.editAddressId;

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
      return res.status(404).json({ error: "Address not found." });
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

    return res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// toggle adders default or not
exports.toggleAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const { id } = req.params;

    let address = await AddressSchema.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found." });
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

    return res.status(200).json({
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get all address of user
exports.getUsersAllAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found in request." });
    }

    const addressArray = await AddressSchema.find({ userId: req.user._id });

    return res
      .status(200)
      .json({ message: "Address fetched successfully", data: addressArray });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ORDER HISTORY
exports.getOrderHistory = (req, res) => {
  res.render("user/account/orders/orderHistory", { currentPage: "orders" });
};

exports.getAllOrders = async (req, res) => {
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
    console.log(paginatedResults);

    res.status(200).json({ success: true, orders: paginatedResults, hasMore });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
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
    delete req.session.orderErrorMessage ;

    res.render("user/account/orders/orderDetails", {
      currentPage: "orders",
      orderDetails,
      orderMessage,
      couponMessage,
      orderErrorMessage
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getDeliveryInfo = async (req, res) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const address = await AddressSchema.findById(order.addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.status(200).json({ address });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getRewards = async (req, res, next) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const userCoupon = await UserCoupon.findOne({ orderId: orderId });

    if (!userCoupon) {
      return res
        .status(400)
        .json({ message: "No coupons credited in this order" });
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
      return res.status(404).json({ error: "Coupon not found" });
    }

    const { discount } = coupon;

    res.status(200).json({ message, discount });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = {
      orderId: "INV-12345",
      date: "2025-03-07",
      shipping: {
        name: "John Doe",
        address: "123 Main St",
        city: "New York",
        zip: "10001",
        country: "USA",
      },
      payment: {
        method: "Credit Card",
        transactionId: "TXN123456",
      },
      items: [
        { name: "Laptop", unitPrice: 1200, quantity: 1 },
        { name: "Mouse", unitPrice: 25, quantity: 2 },
        { name: "Keyboard", unitPrice: 50, quantity: 1 },
      ],
      total: 1300, // Sum of all products
      discount: 50, // Discount applied
    };

    const orderId = req.session.ordId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    const orderDetails = await getFullOrderDetails(orderId)

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
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="invoice.pdf"'
    );
    res.end(pdfBuffer); // Correctly sends binary data
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating Invoice");
  }
};

// need to test
exports.getOrderItems = async (req, res) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    const orderItems = await OrderItem.find({ orderId: orderId });

    if (!orderItems) {
      return res.status(404).json({ error: "Order items not found" });
    }

    res.status(200).json({ items: orderItems });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.cancelOrderByUser = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    console.log(cancelReason);

    if (!cancelReason) {
      return res.status(400).json({ error: "Provide a valid reason" });
    }

    const orderId = req.session.ordId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    // call the cancel order method here
    await cancelOrder(orderId, cancelReason);

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getReturnProductPage = async (req, res) => {
  try {
    const orderId = req.session.ordId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }

    const items = await OrderItem.find({
      orderId: orderId,
      returnStatus: { $eq: "none" },
    });
    console.log(items);

    if (!items) {
      return res.status(404).json({ error: "Order Items not found" });
    }

    res.render("user/account/orders/returnProduct", {
      currentPage: "orders",
      items,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.returnSelectedProducts = async (req, res) => {
  try {
    const orderId = req.session.ordId;

    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }

    const order = await Order.findById(orderId);
    console.log(order);

    if (order.orderStatus !== "Delivered") {
      return res.status(404).json({ error: "Order Is not yet deliverd" });
    }

    const today = new Date();
    const deliveryDate = new Date(order.deliveryDate);

    const differenceInTime = today - deliveryDate;
    const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

    if (differenceInDays > 10) {
      return res.status(400).json({
        error:
          "You can no longer return this product, since the 10-day return duration has exceeded.",
      });
    }

    const items = await OrderItem.find({ orderId: orderId });
    console.log(items);

    if (!items) {
      return res.status(404).json({ error: "Order Items not found" });
    }

    const { productIds, returnReson } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Choose the items you want to return" });
    }

    if (!returnReson) {
      return res
        .status(400)
        .json({ error: "Please provide a reason for returning" });
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
      return res
        .status(400)
        .json({ error: "No matching products found in order. Request faild" });
    }

    res.status(200).json({ message: "Return request send" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// WALLET
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.redirect("/account");
    }
    console.log(wallet);

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
      return res.status(400).json({ error: "Error geting user" });
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
      .status(200)
      .json({ success: true, transactions: paginatedResult, hasMore });
  } catch (error) {
    console.log(error);
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
      return res.status(400).json({ error: "Faild to get the user coupons" });
    }

    res.status(200).json({ userCoupons });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
--controllers i will have here

to get users personal detail page
to post the updated personal details
to post the new password

to get the delivery address's page
to delete a address
to get the edit a address page
to post the updated address
to get the add new address page
to post the new address
to make a address as default

to get the wallet page with details
to get the page to view the available coupens

to view the wishlist page
to remove a product from wishlist

*/
