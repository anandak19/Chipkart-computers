const UserSchema = require("../models/User");
const CategoriesSchema = require("../models/Category");

exports.getDashboard = (req, res) => {
  res.render("admin/dashbord", { title: "Admin Dashboard" });
};

// -----user management start------
// render all users
exports.getUserManagement = async (req, res) => {
  try {
    const usersArray = await UserSchema.find();
    console.log(usersArray);
    res.render("admin/userManagement", {
      title: "User Management",
      usersArray,
      searchQuery: "",
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
      return res.status(400).send("User ID is required.");
    }

    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error toggling block status:", error);
    return res.status(500).send("An error occurred while updating the user.");
  }
};

// search a user
exports.searchUser = async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim();

    if (!searchQuery || searchQuery.length === 0) {
      return res.status(400).send("Search query is required.");
    }

    console.log("Search Query:", searchQuery);

    const usersArray = await UserSchema.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ],
    });

    if (usersArray.length === 0) {
      return res.render("admin/userManagement", {
        usersArray,
        title: "User Management",
        searchQuery: searchQuery,
      });
    }

    res.render("admin/userManagement", {
      usersArray,
      title: "User Management",
      searchQuery: searchQuery,
    });
  } catch (error) {
    console.error("Error searching for users:", error);
    res.status(500).send("An error occurred while searching for users.");
  }
};
// -----user management end------

// -----product management start------
exports.getProductManagement = (req, res) => {
  /*
  get all the products from the databse and return it as an arry
  */

  res.render("admin/productManagement", {
    title: "Product Management",
    searchQuery: "",
  });
};

exports.getProductForm = (req, res) => {
  res.render("admin/productForm", { title: "Product Management - New" });
};

exports.addNewProduct = (req, res) => {
  /*
  get the product details and validate the entered data
  
  */
};

// -----product management end------

exports.getCategoryManagement = async (req, res) => {
  try {
    // delete req.session.flash;

    const categoriesArray = await CategoriesSchema.find();
    console.log(categoriesArray);
    // render the categoris with out paginations
    res.render("admin/categoryManagement", {
      title: "Category Management",
      categoriesArray,
    });
  } catch (error) {
    // add gracefull error management later
    console.log(error);
  }
};

exports.getCategoryForm = (req, res) => {
  res.render("admin/formCategory", {
    title: "Category Management - New",
    errorMessage: req.flash("errorMessage"),
    successMessage: req.flash("successMessage"),
  });
};

exports.postCategoryForm = async (req, res) => {
  try {
    const categoryName = req.body?.categoryName?.trim() || "";
    const isListed = req.body?.isListed;

    if (!categoryName || !isListed) {
      req.flash("errorMessage", "Please enter the values");
      return res.redirect("/admin/categories/new");
    }

    const existingCategory = await CategoriesSchema.findOne({ categoryName });
    if (existingCategory) {
      console.log(existingCategory);
      req.flash(
        "errorMessage",
        "Category with same name exists. Please try another name"
      );
      return res.redirect("/admin/categories/new");
    }

    const newCategory = new CategoriesSchema({ categoryName, isListed });
    await newCategory.save();
    req.flash("successMessage", "New category added");
    return res.redirect("/admin/categories/new");
  } catch (error) {
    console.log(error);
    req.flash("errorMessage", "Somthing went wrong");
    return res.redirect("/admin/categories/new");
  }
};

exports.toggleListCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId) {
      return res.status(400).send("Category id not found.");
    }
    const category = await CategoriesSchema.findById(categoryId);
    if (!category) {
      return res.status(404).send("Category not found.");
    }

    category.isListed = !category.isListed;
    await category.save();

    console.log("updated")
    res.redirect('/admin/categories')
  } catch (error) {
    console.log(error)
    res.redirect('/admin/categories')
  }
};

exports.getUpdateCategoryForm = async(req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId) {
      return res.status(400).send("Category id not found.");
    }
    const category = await CategoriesSchema.findById(categoryId);
    if (!category) {
      return res.status(404).send("Category not found.");
    }
    res.render('admin/formUpdateCategory', {
      title: "Category Management - Edit",
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      category
    })
  } catch (error) {
    console.log(error)
    res.redirect('/admin/categories')
  }
};

exports.postUpdateCategoryForm = async(req, res) => {

  try {
    const { id } = req.params;
    if(!id) {
      return res.redirect("/admin/categories");
    }
    const categoryName = req.body?.categoryName?.trim() || "";
    const isListed = req.body?.isListed;
    const category = {categoryName, isListed, id}
  
  
    if (!categoryName || !isListed) {
      req.flash("errorMessage", "Please enter the values");
      return res.redirect("/admin/categories/new");
    }
  
    const updatedCategory = await CategoriesSchema.findOneAndUpdate(
      {_id: id}, {categoryName: categoryName, isListed: isListed}
    )


    req.flash("successMessage", "Category updated successfully");
    res.redirect(`/admin/categories/edit/${id}`)
  } catch (error) {
    console.log(error)
    return res.redirect("/admin/categories");
  }






}

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
