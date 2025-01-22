const UserSchema = require("../models/User");
const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");

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
exports.getProductManagement = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  try {
    const productsArray = await ProductSchema.aggregate([
      {
        $addFields: {
          categoryIdObject: { $toObjectId: "$categoryId" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryIdObject",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const totalProducts = await ProductSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/productManagement", {
      title: "Product Management",
      productsArray,
      currentPage: page,
      totalPages,
      searchQuery: "",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getProductForm = (req, res) => {
  try {
    CategoriesSchema.aggregate([
      {
        $match: {
          isListed: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          categoryName: 1,
        },
      },
    ])
      .then((categoryArray) => {
        res.render("admin/productForm", {
          title: "Product Management - New",
          categoryArray,
          errorMessage: req.flash("errorMessage"),
          successMessage: req.flash("successMessage"),
        });
      })
      .catch((error) => {
        console.log(error);
        res.redirect("/admin/products");
      });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/products");
  }
};

exports.addNewProduct = async (req, res) => {
  try {
    const { productName, categoryId, brand, description } = req.body;
    const mrp = parseFloat(req.body.mrp);
    const discount = parseFloat(req.body.discount);
    const finalPrice = parseFloat(req.body.finalPrice);
    const quantity = parseFloat(req.body.quantity);
    const highlights = JSON.parse(req.body.highlights);

    const images = req.files.map((file) => ({
      filename: file.filename,
      filepath: `/uploads/${file.filename}`,
    }));

    const newProduct = new ProductSchema({
      productName,
      categoryId,
      brand,
      description,
      mrp,
      discount,
      finalPrice,
      quantity,
      highlights,
      images,
    });

    await newProduct.save();
    res
      .status(200)
      .json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getEditProductForm = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      console.log("Id not found");
      return res.redirect("/admin/products");
    }
    const product = await ProductSchema.findById(productId);
    if (!product) {
      console.log("product not found in database");
      return res.redirect("/admin/products");
    }

    const categoryArray = await CategoriesSchema.aggregate([
      {
        $match: {
          isListed: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          categoryName: 1,
        },
      },
    ]);

    res.render("admin/updateProductForm", { 
      title: "Product Management - Edit Product",
      categoryArray,
      product,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
    
  } catch (error) {
    console.log(error);
    res.redirect("/admin/products");
  }
};

// -----product management end------

// -----category management start------
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

    console.log("updated");
    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/categories");
  }
};

exports.getUpdateCategoryForm = async (req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId) {
      return res.status(400).send("Category id not found.");
    }
    const category = await CategoriesSchema.findById(categoryId);
    if (!category) {
      return res.status(404).send("Category not found.");
    }
    res.render("admin/formUpdateCategory", {
      title: "Category Management - Edit",
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      category,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/categories");
  }
};

exports.postUpdateCategoryForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.redirect("/admin/categories");
    }
    const categoryName = req.body?.categoryName?.trim() || "";
    const isListed = req.body?.isListed;

    if (!categoryName || !isListed) {
      req.flash("errorMessage", "Please enter the values");
      return res.redirect(`/admin/categories/edit/${id}`);
    }

    const updatedCategory = await CategoriesSchema.findOneAndUpdate(
      { _id: id },
      { categoryName: categoryName, isListed: isListed },
      { new: true }
    );

    if (!updatedCategory) {
      return res.redirect(`/admin/categories`);
    }

    req.flash("successMessage", "Category updated successfully");
    res.redirect(`/admin/categories/edit/${id}`);
  } catch (error) {
    console.log(error);
    return res.redirect("/admin/categories");
  }
};
// -----category management end------

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
