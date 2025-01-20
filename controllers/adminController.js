const UserSchema = require("../models/User");

exports.getDashboard = (req, res) => {
  res.render("admin/dashbord", { title: "Admin Dashboard" });
};

// render all users 
exports.getUserManagement = async (req, res) => {
  try {
    const usersArray = await UserSchema.find();
    console.log(usersArray);
    res.render("admin/userManagement", {
      title: "User Management",
      usersArray,
      searchQuery: ''
    });
  } catch (error) {
    console.log(error);
  }
};

// block a user 
exports.toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).send('User ID is required.');
    }

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).send('User not found.');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error toggling block status:', error);
    return res.status(500).send('An error occurred while updating the user.');
  }
};

// search a user 
exports.searchUser = async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim();

    if (!searchQuery || searchQuery.length === 0) {
      return res.status(400).send('Search query is required.');
    }

    console.log('Search Query:', searchQuery);

    const usersArray = await UserSchema.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ],
    });

    if (usersArray.length === 0) {
      return res.render("admin/userManagement", { usersArray, title: "User Management", searchQuery: searchQuery});
    }

    res.render("admin/userManagement", { usersArray, title: "User Management", searchQuery: searchQuery });
  } catch (error) {
    console.error('Error searching for users:', error);
    res.status(500).send('An error occurred while searching for users.');
  }
};


// user management end 

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
