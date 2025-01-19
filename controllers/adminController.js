const UserSchema = require("../models/User");

exports.getDashboard = (req, res) => {
  res.render("admin/dashbord", { title: "Admin Dashboard" });
};

exports.getUserManagement = async (req, res) => {
  try {
    const usersArray = await UserSchema.find();
    console.log(usersArray);
    res.render("admin/userManagement", {
      title: "User Management",
      usersArray,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getProductManagement = (req, res) => {
  res.render("admin/productManagement", { title: "Product Management" });
};

exports.getCategoryManagement = (req, res) => {
  res.render("admin/categoryManagement", { title: "Category Management" });
};

exports.getOfferModule = (req, res) => {
  res.render("admin/offerModule", { title: "Offer Module" });
};

exports.getOrderManagement = (req, res) => {
  res.render("admin/orderManagement", { title: "Order Management" });
};

exports.getSalesReport = (req, res) => {
  res.render("admin/salesReport", { title: "Sales Report" });
};

exports.getCouponManagement = (req, res) => {
  res.render("admin/couponManagement", { title: "Coupon Management" });
};
