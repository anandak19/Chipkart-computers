const {
  getOrderItemsDetails,
  cancelOrder,
  refundUserAmount,
} = require("../utils/orderManagement");
const mongoose = require("mongoose");
const { getCategories } = require("../utils/categoryHelpers");
const { addFinalPriceStage } = require("../utils/productHelpers");
const {
  getReportAmounts,
  getSalesCount,
  getAllOrdersDetails,
  getReportOverview,
} = require("../utils/salesHelpers/reportHelpers");
const Session = mongoose.connection.collection("sessions");

const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const ExcelJS = require("exceljs");

const Offer = require("../models/Offer");
const OrderItem = require("../models/orderItem");
const Coupons = require("../models/Coupon");
const Categories = require("../models/Category");
const UserCoupon = require("../models/UserCoupon");
const Order = require("../models/Order");
const Product = require("../models/Product");
const UserSchema = require("../models/User");
const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");
const OrderSchema = require("../models/Order");
const AddressSchema = require("../models/Address");

exports.getDashboard = (req, res) => {
  res.render("admin/dashbord", {
    title: "Admin Dashboard",
    activePage: "dashboard",
  });
};

exports.getChartData = async (req, res, next) => {
  try {
    const period = req.query?.period || "yearly";
    const validPeriods = ["yearly", "monthly", "weekly"];

    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: "Invalid period. Choose from yearly, monthly, or weekly.",
      });
    }

    // declarations
    const currentDate = new Date();
    const currentYear = new Date().getFullYear();
    const pastYears = Array.from(
      { length: 4 },
      (_, i) => currentYear - (i + 1)
    );
    const allYears = [...pastYears.reverse(), currentYear];
    const currentMonth = currentDate.getMonth() + 1;
    const currentWeek = Math.ceil(
      ((currentDate - new Date(currentYear, 0, 1)) / 86400000 +
        new Date(currentYear, 0, 1).getDay() +
        1) /
        7
    );

    // yearly

    const yearlyPipeline = [
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: { year: { $year: { $toDate: "$createdAt" } } },
          totalProducts: { $sum: { $ifNull: ["$quantity", 0] } },
        },
      },
      {
        $sort: { "_id.year": 1 },
      },
      {
        $group: {
          _id: null,
          data: { $push: { year: "$_id.year", value: "$totalProducts" } },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $concatArrays: [
              allYears.map((year) => ({ year, value: 0 })),
              "$data",
            ],
          },
        },
      },
      { $unwind: "$data" },
      {
        $group: {
          _id: "$data.year",
          value: { $max: "$data.value" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          label: "$_id",
          value: 1,
          _id: 0,
        },
      },
    ];

    // monthly
    const pastMonths = Array.from({ length: 12 }, (_, i) => {
      let month = currentMonth - i;
      let year = currentYear;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      return { year, month };
    }).reverse();

    const monthlyPipeline = [
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { $toDate: "$createdAt" } },
            month: { $month: { $toDate: "$createdAt" } },
          },
          totalProducts: { $sum: { $ifNull: ["$quantity", 0] } },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              year: "$_id.year",
              month: "$_id.month",
              value: "$totalProducts",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $concatArrays: [
              pastMonths.map(({ year, month }) => ({ year, month, value: 0 })),
              "$data",
            ],
          },
        },
      },
      { $unwind: "$data" },
      {
        $group: {
          _id: { year: "$data.year", month: "$data.month" },
          value: { $max: "$data.value" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          label: {
            $concat: [
              {
                $cond: { if: { $lt: ["$_id.month", 10] }, then: "0", else: "" },
              },
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.year" },
            ],
          }, // Formats as "MM-YYYY"
          value: 1,
          _id: 0,
        },
      },
    ];

    // weekly
    const pastWeeks = Array.from({ length: 12 }, (_, i) => {
      let week = currentWeek - i;
      let year = currentYear;
      if (week <= 0) {
        year -= 1;
        week += 52;
      }
      return { year, week };
    }).reverse();

    const weeklyPipeline = [
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { $toDate: "$createdAt" } },
            week: { $isoWeek: { $toDate: "$createdAt" } },
          },
          totalProducts: { $sum: { $ifNull: ["$quantity", 0] } },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              year: "$_id.year",
              week: "$_id.week",
              value: "$totalProducts",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $concatArrays: [
              pastWeeks.map(({ year, week }) => ({ year, week, value: 0 })),
              "$data",
            ],
          },
        },
      },
      { $unwind: "$data" },
      {
        $group: {
          _id: { year: "$data.year", week: "$data.week" },
          value: { $max: "$data.value" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
      {
        $project: {
          label: {
            $concat: [
              { $toString: "$_id.year" },
              "-W",
              {
                $cond: { if: { $lt: ["$_id.week", 10] }, then: "0", else: "" },
              },
              { $toString: "$_id.week" },
            ],
          },
          value: 1,
          _id: 0,
        },
      },
    ];

    let result;

    switch (period) {
      case "yearly":
        result = await OrderItem.aggregate(yearlyPipeline);
        break;

      case "monthly":
        result = await OrderItem.aggregate(monthlyPipeline);
        break;

      case "weekly":
        result = await OrderItem.aggregate(weeklyPipeline);
        break;

      default:
        return res.status(400).json({
          error: "Invalid period. Choose from yearly, monthly, or weekly.",
        });
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.getTopSellingData = async (req, res, next) => {
  try {

    const bestSellingProductsPipeline = [
      {
        $group: {
          _id: "$productId",
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productDetails.productName",
        }
      }
    ];

    const topCategoriesPipeline = [
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails" 
      },
      {
        $group: {
          _id: {$toObjectId: "$productDetails.categoryId"} ,
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { orderCount: -1 } 
      },
      {
        $limit: 5 
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $unwind: "$categoryDetails"
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          name: "$categoryDetails.categoryName",
          orderCount: 1
        }
      }
    ];

    const bestSellingBrandsPipeline = [
      {
        $lookup: {
          from: "products", 
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails" 
      },
      {
        $group: {
          _id: "$productDetails.brand", 
          orderCount: { $sum: 1 } 
        }
      },
      {
        $sort: { orderCount: -1 } 
      },
      {
        $limit: 5 
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          orderCount: 1
        }
      }
    ];
    
    const [bestSellingBrands, topCategories, bestSellingProducts] = await Promise.all([
      OrderItem.aggregate(bestSellingBrandsPipeline),
      OrderItem.aggregate(topCategoriesPipeline),
      OrderItem.aggregate(bestSellingProductsPipeline)
    ])


    res.status(200).json({bestSellingBrands, topCategories, bestSellingProducts});
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// -----user management start------
// render user management page
exports.getUserManagementPage = async (req, res) => {
  try {
    const usersArray = await UserSchema.find();
    res.render("admin/userManagement", {
      title: "User Management",
      usersArray,
      searchQuery: "",
      activePage: "users",
    });
  } catch (error) {
    console.log(error);
  }
};

// returns all users with pagination, or the searched user
// BUG: when applying serach the other users data is also coming in the array of result
exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page) || 0;
    const limit = 5; //make this to 5 later
    const skip = page * limit;
    const pipeline = [];

    if (search) {
      const query = search.trim();
      pipeline.push({
        $match: {
          $text: { $search: query },
        },
      });
    }

    pipeline.push({
      $match: { isAdmin: false },
    });

    pipeline.push({
      $facet: {
        usersCount: [{ $count: "total" }],
        paginatedResult: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const result = await UserSchema.aggregate(pipeline);

    const totalUsers = result[0]?.usersCount[0]?.total || 0;
    const users = result[0]?.paginatedResult;
    const hasMore = skip + users.length < totalUsers;

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      totalUsers,
      users,
      hasMore,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// block/unblock a user
/*
user id is needed in the params and reson is needed for blocking only
if the user.isBlocked is true it will unblock the user and set the block reson to empty
if the user.isBlocked is false , then user will get blocked and reson will be saved
*/
exports.toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserSchema.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      user.isBlocked = false;
      user.blockReason = "";
    } else {
      const { reason } = req.body;
      if (!reason) {
        return res
          .status(400)
          .json({ message: "No reason provided, blocking failed" });
      }
      user.isBlocked = true;
      user.blockReason = reason;
    }

    // clear all the session with user and completly logout user
    await Session.deleteMany({ "session.userId": id });

    await user.save();
    res.status(200).json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
        activePage: "users",
      });
    }

    res.render("admin/userManagement", {
      usersArray,
      title: "User Management",
      searchQuery: searchQuery,
      activePage: "users",
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
    let query = req.query.q;

    const pipeline = [
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
      addFinalPriceStage,
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $sort: { createdAt: -1 },
      },
    ];

    if (query) {
      query = query.trim();
      pipeline.unshift({
        $match: { $text: { $search: query } },
      });
    }

    const productsArray = await ProductSchema.aggregate(pipeline);
    console.log(productsArray);

    const totalProducts = await ProductSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("admin/products/productManagement", {
      title: "Product Management",
      productsArray,
      currentPage: page,
      totalPages,
      searchQuery: "",
      activePage: "products",
    });
  } catch (error) {
    console.log(error);
  }
};

// not in use
exports.getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = 5;
    const skip = page * limit;

    let query = req.query.q;

    const pipeline = [
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
        $addFields: {
          finalPrice: {
            $subtract: [
              "$mrp",
              { $multiply: ["$mrp", { $divide: ["$discount", 100] }] },
            ],
          },
        },
      },
      {
        $facet: {
          paginatedResult: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: "totalProducts" }],
        },
      },
    ];

    if (query) {
      query = query.trim();
      pipeline.unshift({
        $match: { $text: { $search: query } },
      });
    }

    const result = await ProductSchema.aggregate(pipeline);

    const paginatedResult = result[0]?.paginatedResult;
    const total = result[0]?.total[0]?.totalProducts || 0;
    const hasMore = skip + paginatedResult.length < total;
    console.log(paginatedResult);

    res.status(200).json({ productsArray: paginatedResult, total, hasMore });
  } catch (error) {
    console.log(error);
    next(error);
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
        console.log(categoryArray);
        res.render("admin/products/productForm", {
          title: "Product Management - New",
          categoryArray,
          errorMessage: req.flash("errorMessage"),
          successMessage: req.flash("successMessage"),
          activePage: "products",
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
    const { productName, categoryId, brand, description, positions } = req.body;
    // console.log(req.body)
    const mrp = parseFloat(req.body.mrp);
    const finalPrice = parseFloat(req.body.finalPrice);
    const quantity = parseFloat(req.body.quantity);
    const highlights = JSON.parse(req.body.highlights);

    const images = req.files.map((file, index) => ({
      filename: file.filename,
      filepath: `/uploads/${file.filename}`,
      position: positions ? parseInt(positions[index], 10) : index + 1,
    }));
    console.log(images);

    const newProduct = new ProductSchema({
      productName,
      categoryId,
      brand,
      description,
      mrp,
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

    req.session.selectedProductId = product._id;

    res.render("admin/products/updateProductForm", {
      title: "Product Management - Edit Product",
      categoryArray,
      product,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      activePage: "products",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/products");
  }
};

// we need to update the clint side code coz, after succsfull the old data is shoing , we need to refesh the page or redierct the user
exports.postEditProductForm = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }
    console.log("data from clint", req.body);

    const { productName, categoryId, brand, description } = req.body;
    let { positions } = req.body;
    const mrp = parseFloat(req.body.mrp);
    const quantity = parseFloat(req.body.quantity);
    const isFeatured = req.body.isFeatured === "true";
    const highlights = req.body.highlights
      ? JSON.parse(req.body.highlights)
      : [];

    const imageToDelete = req.body.imageToDelete
      ? JSON.parse(req.body.imageToDelete)
      : [];

    const product = await ProductSchema.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (productName !== undefined && productName !== null) {
      product.productName = productName;
    }
    if (categoryId !== undefined && categoryId !== null) {
      product.categoryId = categoryId;
    }
    if (brand !== undefined && brand !== null) {
      product.brand = brand;
    }
    if (description !== undefined && description !== null) {
      product.description = description;
    }
    if (mrp !== undefined && mrp !== null) {
      product.mrp = mrp;
    }
    if (quantity !== undefined && quantity !== null) {
      product.quantity = quantity;
    }
    if (isFeatured !== undefined && isFeatured !== null) {
      product.isFeatured = isFeatured;
    }
    if (Array.isArray(highlights) && highlights.length > 0) {
      product.highlights = highlights;
    }

    // delete images code ---
    if (imageToDelete) {
      console.log(imageToDelete);
      product.images.forEach((image, index) => {
        const imageId = String(image._id);

        if (imageToDelete.includes(imageId)) {
          product.images[index].filepath = null;
          product.images[index].filename = null;
          console.log("one image deleted");
        }
      });
    }

    let newImages = [];

    // filter only number values and convert to Number type  - from positions
    if (positions) {
      positions = positions
        .filter(
          (pos) =>
            pos !== undefined && pos !== null && pos !== "" && !isNaN(pos)
        )
        .map((pos) => parseInt(pos));
    }

    if (req.files && req.files.length > 0) {
      console.log("updated images in req.files", req.files);
      // Loop through the uploaded files and create new image objects
      newImages = req.files.map((file, index) => ({
        filename: file.filename,
        filepath: `/uploads/${file.filename}`,
        position: positions ? positions[index] : index + 1,
      }));
    }

    // updating images
    if (positions) {
      newImages.forEach((newImage) => {
        product.images.forEach((existingImage, index) => {
          if (newImage.position === existingImage.position) {
            product.images[index] = newImage;
          }
        });
      });
    }

    await product.save();
    res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.toggleListProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).send("Product id not found.");
    }
    const product = await ProductSchema.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    product.isListed = !product.isListed;
    await product.save();

    console.log("updated");
    res.redirect("/admin/products");
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
    res.render("admin/category/categoryManagement", {
      title: "Category Management",
      categoriesArray,
      activePage: "categories",
    });
  } catch (error) {
    // add gracefull error management later
    console.log(error);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";

    let filter = {};
    if (searchQuery) {
      filter = { categoryName: { $regex: searchQuery, $options: "i" } };
    }

    const categoriesArray = await CategoriesSchema.find(filter);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categoriesArray,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getCategoryForm = (req, res) => {
  res.render("admin/category/formCategory", {
    title: "Category Management - New",
    errorMessage: req.flash("errorMessage"),
    successMessage: req.flash("successMessage"),
    activePage: "categories",
  });
};

// save new category
exports.postCategoryForm = async (req, res) => {
  try {
    const categoryName = req.body?.categoryName?.trim() || "";
    const isListed = req.body?.isListed;

    if (!categoryName || !isListed) {
      return res.status(400).json({ error: "Please enter the values" });
    }

    const existingCategory = await CategoriesSchema.findOne({
      categoryName: { $regex: new RegExp("^" + categoryName + "$", "i") },
    });
    if (existingCategory) {
      console.log(existingCategory);
      return res.status(400).json({
        error: "Category with same name exists. Please try another name",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // save image to cloudinary

    const imagePath = `/uploads/${req.file.filename}`;

    const newCategory = new CategoriesSchema({
      categoryName,
      isListed,
      imagePath,
    });

    await newCategory.save();
    res.status(200).json({ message: "Category added successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
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
      res.redirect("/admin/categories");
    }

    req.session.categoryId = category._id;
    res.render("admin/category/formUpdateCategory", {
      title: "Category Management - Edit",
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      category,
      activePage: "categories",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/categories");
  }
};

exports.postUpdateCategoryForm = async (req, res) => {
  try {
    const id = req.session.categoryId;
    if (!id) {
      return res.status(400).json({ error: "Session expired" });
    }

    const category = await CategoriesSchema.findById(id);
    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    console.log(id);
    const categoryName = req.body?.categoryName?.trim() || "";
    const isListed = req.body?.isListed;

    if (!categoryName || !isListed) {
      return res.status(400).json({ error: "Please enter the values" });
    }

    const existingCategory = await CategoriesSchema.findOne({
      categoryName: { $regex: new RegExp("^" + categoryName + "$", "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({
        error: "Category with same name exists. Please try another name",
      });
    }

    let imagePath;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    category.categoryName = categoryName || category.categoryName;
    category.isListed = isListed || category.isListed;
    if (req.file) {
      category.imagePath = imagePath || category.imagePath;
    }

    await category.save();

    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAvailableCategories = async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.status(200).json({ data: categories });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
// -----category management end------

// ----------offer management start--------

exports.getOfferModule = (req, res) => {
  res.render("admin/offer/offerModule", {
    title: "Offer Module",
    activePage: "offers",
  });
};

exports.getNewOfferForm = (req, res) => {
  res.render("admin/offer/offerForm", {
    title: "Offer Module - New Offer",
    edit: false,
    activePage: "offers",
  });
};

exports.saveNewOffer = async (req, res, next) => {
  try {
    const { offerTitle, discount, offerTarget, startDate, endDate } = req.body;
    const newDiscount = parseInt(discount);

    // create new offer
    const newOffer = new Offer({
      offerTitle,
      discount: newDiscount,
      offerTarget,
      startDate,
      endDate,
    });

    // save new offer
    const savedOffer = await newOffer.save();
    if (!savedOffer) {
      return res.status(404).json({ error: "Faild to create new offer" });
    }

    return res.status(200).json({
      message: "Offer created successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getAllOffers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page) || 0;
    const limit = 5;
    const skip = page * limit;

    const pipeline = [
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          offersCount: [{ $count: "total" }],
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    if (search) {
      const query = search.trim();
      pipeline.unshift({
        $match: {
          offerTitle: { $regex: query, $options: "i" },
        },
      });
    }

    const result = await Offer.aggregate(pipeline);

    const totalOffers = result[0]?.offersCount[0]?.total || 0;
    const offers = result[0]?.paginatedResult;
    const hasMore = skip + offers.length < totalOffers;

    res.status(200).json({
      totalOffers,
      offers,
      hasMore,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getEditOfferForm = async (req, res) => {
  try {
    const offerId = req.params.id;

    if (!offerId) {
      console.log("no offer id");
      return res.redirect("/admin/offers");
    }

    const offer = await Offer.findById(offerId);

    if (!offer) {
      console.log("no offer found");
      return res.redirect("/admin/offers");
    }

    req.session.offerId = offer._id;

    res.render("admin/offer/offerForm", {
      title: "Offer Module - Edit Offer",
      edit: true,
      activePage: "offers",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/offers");
  }
};

exports.getSingleOfferDetails = async (req, res, next) => {
  try {
    const offerId = req.session.offerId;

    if (!offerId) {
      return res
        .status(400)
        .json({ success: false, message: "Offer ID is missing." });
    }

    let offer = await Offer.findById(offerId).lean();

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found." });
    }

    if (offer.target === "category") {
      const category = await Categories.findById(offer.categoryId);
      if (!category) {
        return res.status(404).json({ error: "Offer category not found" });
      }

      offer.category = category.categoryName;
    } else {
      offer.category = "All";
    }

    return res.status(200).json({ offer });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// updating...
exports.saveUpdatedOffer = async (req, res, next) => {
  try {
    const { offerTitle, discount, startDate, endDate } = req.body;
    const newDiscount = parseInt(discount);

    const offerId = req.session.offerId;

    if (!offerId) {
      return res
        .status(400)
        .json({ success: false, message: "Offer ID is missing." });
    }

    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found." });
    }

    offer.offerTitle = offerTitle ?? offer.offerTitle;
    offer.discount = discount ?? offer.discount;
    offer.startDate = startDate ?? offer.startDate;
    offer.endDate = endDate ?? offer.endDate;
    await offer.save();

    // find all product with this offer and update
    const result = await ProductSchema.updateMany(
      { offerId: offer._id },
      {
        $set: {
          discount: newDiscount,
          offerStartDate: startDate ?? null,
          offerEndDate: endDate ?? null,
        },
      }
    );

    return res.status(200).json({
      message: "Offer updated successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.tooggleOfferStatus = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    if (!offerId) {
      return res.status(400).send("offer id not found.");
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).send("offer not found.");
    }

    offer.isActive = !offer.isActive;
    const active = offer.isActive;
    await offer.save();

    await ProductSchema.updateMany(
      { offerId: offer._id },
      {
        $set: {
          discount: active ? offer.discount : 0,
          offerStartDate: active ? offer.startDate : null,
          offerEndDate: active ? offer.endDate : null,
        },
      }
    );

    return res.status(200).json({
      message: "Offer status updated successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// render offer applay page for product or category
exports.getOfferApplyPage = async (req, res, next) => {
  try {
    const type = req.query.type;
    if (!type) {
      return res.redirect("/admin");
    }

    if (!["product", "category"].includes(type)) {
      return res.redirect("/admin");
    }
    const targetId = req.params.id;
    let activePage;
    if (type === "product") {
      const product = await Product.findById(targetId);
      if (!product) {
        return res.redirect("/admin/products");
      }
      activePage = "products";
    } else {
      const category = await Categories.findById(targetId);
      if (!category) {
        return res.redirect("/admin/categories");
      }
      activePage = "categories";
    }

    req.session.offertype = type;
    req.session.offerTargetId = targetId;

    res.render("admin/offer/applyOffer", {
      title: "Product Offer",
      activePage: activePage,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// WOKING FINE/ IMPEMENT CLINT
// get the all offers availble of the type - product/category
// adds a new feald which is selected; true or false
exports.getOfferOfType = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = 8;
    const skip = page * limit;
    console.log("run");

    // product/cateogory
    const offertype = req.session.offertype;
    // product id / category id
    const offerTargetId = req.session.offerTargetId;

    if (!offertype || !offerTargetId) {
      return res
        .status(400)
        .json({ error: "Session expired, faild to get offers" });
    }

    let product;
    if (offertype === "product") {
      product = await Product.findById(offerTargetId);
      if (!product) {
        return res.status(404).json({ error: "Selected product is not found" });
      }
    } else {
      product = await Product.findOne({ categoryId: offerTargetId });
    }

    const appliedOfferId = product?.offerId || null;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const aggregationResult = await Offer.aggregate([
      {
        $match: {
          offerTarget: offertype,
          isActive: true,
          startDate: { $lte: today },
          endDate: { $gt: today },
        },
      },
      {
        $addFields: {
          isSelected: {
            $cond: {
              if: { $eq: ["$_id", appliedOfferId] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
          totalOffers: [{ $count: "total" }],
        },
      },
    ]);

    const availableOffers = aggregationResult[0]?.paginatedResult;
    const total = aggregationResult[0]?.totalOffers[0]?.total || 0;
    const hasMore = skip + availableOffers.length < total;

    res.status(200).json({ availableOffers, total, hasMore });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.applyNewOffer = async (req, res, next) => {
  /*
get the offer id form path
get the offer type from session and
get the selected product/ targetId
find the 
based on type, 
if type is product 
  -find the product with id and update its discount, offerStartDate, offerEnddate, offerId
if type is category
  -find the all product with category id and update its its discount, offerStartDate, offerEnddate, offerid - using updateMany
return success message
*/
  try {
    const offerId = req.params?.id;
    const offertype = req.session?.offertype;
    const offerTargetId = req.session?.offerTargetId;

    if (!offerId) {
      return res.status(400).json({ error: "Please select one offer" });
    }

    if (!offertype || !offerTargetId) {
      return res
        .status(400)
        .json({ error: "Session expired! failed to apply offer" });
    }

    // validate offer
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res
        .status(400)
        .json({ error: "Offer not found. Choose another offer" });
    }

    if (!offer.isActive) {
      return res.status(400).json({ error: "Offer is inactive" });
    }

    // apply product offer to product only
    if (offertype === "product") {
      const updatedProduct = await Product.findByIdAndUpdate(
        offerTargetId,
        {
          $set: {
            discount: offer.discount,
            offerStartDate: offer.startDate,
            offerEndDate: offer.endDate,
            offerId: offer._id,
          },
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({ error: "Selected product is not found" });
      }
      return res.status(200).json({ message: "Offer applied Successfully" });

      // apply category offer to all products in the cateogory
    } else {
      //find the all product with the offerTargetId and update the
      const updatedProducts = await Product.updateMany(
        { categoryId: offerTargetId, discount: { $lte: offer.discount } },
        {
          $set: {
            discount: offer.discount,
            offerStartDate: offer.startDate,
            offerEndDate: offer.endDate,
            offerId: offer._id,
          },
        }
      );

      if (updatedProducts.modifiedCount === 0) {
        return res.status(404).json({
          error:
            "No products were updated. They may already have a better discount.",
        });
      }
      return res.status(200).json({
        message: "Offer applied to all products in this category",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.removeExistingOffer = async (req, res, next) => {
  try {
    const offertype = req.session?.offertype;
    const offerTargetId = req.session?.offerTargetId;

    if (!offertype || !offerTargetId) {
      return res
        .status(400)
        .json({ error: "Session expired! failed to apply offer" });
    }

    // find the product and remove its offer related fealds
    if (offertype === "product") {
      const updatedProduct = await Product.findByIdAndUpdate(
        offerTargetId,
        {
          $set: {
            discount: 0,
            offerStartDate: null,
            offerEndDate: null,
            offerId: null,
          },
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({ error: "Selected product is not found" });
      }
      return res.status(200).json({ message: "Offer removed Successfully" });

      // remove the fealds from the producst inthe  cateogory
    } else {
      //find the all product with the offerTargetId and update the
      const updatedProducts = await Product.updateMany(
        { categoryId: offerTargetId },
        {
          $set: {
            discount: 0,
            offerStartDate: null,
            offerEndDate: null,
            offerId: null,
          },
        }
      );

      if (updatedProducts.modifiedCount === 0) {
        return res.status(404).json({
          error: "No products were updated.",
        });
      }
      return res.status(200).json({
        message: "Offer removed from all products in this category",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// update the offer in offer module
// ---
/*
get the offer id and find the offer
update its offer disocunt, or endDate of title
1. find all the product with offer id
2 update its discount, offerStartDate, offerEnddate, offerId
3. return the message
*/
// ----------offer management end--------

// -------------ORDER MANAGMENT START
exports.getOrderManagement = (req, res) => {
  res.render("admin/orders/orderManagement", {
    title: "Order Management",
    activePage: "orders",
  });
};

exports.getAllOrders = async (req, res) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page) || 0;
    const limit = 5; //make this to 5 later
    const skip = page * limit;
    const pipeline = [];

    if (search) {
      const query = search.trim();
      pipeline.push({
        $match: {
          orderId: { $regex: query, $options: "i" },
        },
      });
    }

    pipeline.push({
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "items",
      },
    });

    pipeline.push({
      $facet: {
        ordersCount: [{ $count: "total" }],
        paginatedResult: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const result = await OrderSchema.aggregate(pipeline);
    console.log(result);

    const totalorders = result[0]?.ordersCount[0]?.total || 0;
    const orders = result[0]?.paginatedResult;
    const hasMore = skip + orders.length < totalorders;

    res.status(200).json({
      totalorders,
      orders,
      hasMore,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const validStatuses = ["Ordered", "Shipped", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order status" });
    }

    const order = await OrderSchema.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.orderStatus = status;

    const modifiedOrderItems = await OrderItem.updateMany(
      { orderId: order._id },
      { $set: { orderStatus: status } }
    );

    if (modifiedOrderItems.modifiedCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order items not found" });
    }

    if (status === "Delivered") {
      order.deliveryDate = new Date();
      const strOrderId = String(order._id);
      const userCoupon = await UserCoupon.findOne({ orderId: strOrderId });
      if (userCoupon) {
        userCoupon.isCredited = true;
        await userCoupon.save();
      }
    }

    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.renderOrderDetailsPage = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.redirect("/orders/all");
    }

    const orderDetails = await OrderSchema.findById(orderId);
    if (!orderDetails) {
      res.redirect("/orders/all");
    }

    req.session.orderId = orderDetails._id;

    res.render("admin/orders/orderDetails", {
      title: "Order Details",
      orderDetails,
      activePage: "orders",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/orders/all");
  }
};

// get user detail with id
exports.getUserDataAndDeliveryInfo = async (req, res) => {
  try {
    const orderId = req.session.orderId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    const order = await OrderSchema.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    console.log(order.userId);

    const user = await UserSchema.findById(order.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const address = await AddressSchema.findById(order.addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.status(200).json({ user, address });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrderItems = async (req, res) => {
  try {
    const orderId = req.session.orderId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }
    const items = await OrderItem.find({ orderId: orderId });

    console.log("The result");
    if (!items) {
      return res.status(404).json({ error: "Items not found for order" });
    }

    res.status(200).json({ items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get order items
exports.cancelOrderByAdmin = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    if (!cancelReason) {
      return res.status(400).json({ error: "Provide a valid reason" });
    }

    const orderId = req.session.orderId;
    if (!orderId) {
      return res.status(400).json({ error: "Session expired" });
    }

    await cancelOrder(orderId, cancelReason);

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.approveReturnItem = async (req, res) => {
  try {
    let { id: itemId } = req.params;

    const orderItem = await OrderItem.findById(itemId);

    orderItem.returnStatus = "approved";
    orderItem.isReturned = true;
    orderItem.returnDate = new Date();

    const amount = orderItem.subTotalPrice;

    const order = await Order.findById(orderItem.orderId);
    const userId = order.userId;

    refundUserAmount(amount, userId, "itemReturn");

    orderItem.isRefunded = true;
    await orderItem.save();
    res.status(200).json({ message: "Return approved successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// not completed ---
exports.rejectReturnItemRefund = async (req, res, next) => {
  try {
    let { id: itemId } = req.params;
    const { reason } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "Item details missing" });
    }

    if (!reason) {
      return res
        .status(400)
        .json({ error: "Please provide a reson for rejection" });
    }

    const orderItem = await OrderItem.findById(itemId);

    //add somthing here
    if (!orderItem) {
      return res
        .status(400)
        .json({ error: "Selected order item was not found" });
    }

    orderItem.returnStatus = "rejected";
    orderItem.isReturned = true;
    orderItem.returnDate = new Date();
    orderItem.isReturnRejected = true;
    orderItem.returnRejectReason = reason;

    await orderItem.save();

    res.status(200).json({ message: "Return refund rejected successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// -------------ORDER MANAGMENT END

// REPORT START
exports.getSalesReport = (req, res) => {
  res.render("admin/reports/salesReport", {
    title: "Sales Report",
    activePage: "reports",
  });
};

exports.fetchSalesReportData = async (req, res, next) => {
  try {
    const { period, startDateQuery, endDateQuery } = req.query;

    const now = new Date();
    let startDate = new Date("1970-01-01T00:00:00.000Z");
    let endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    if (startDateQuery && endDateQuery) {
      //date wise operations
      startDate = new Date(startDateQuery);
      endDate = new Date(endDateQuery);
      endDate.setUTCHours(23, 59, 59, 999);
    } else if (period) {
      // period wise operation
      switch (period) {
        case "day":
          startDate = new Date();
          startDate.setUTCHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setUTCHours(23, 59, 59, 999);
          break;

        case "week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          startDate.setUTCHours(0, 0, 0, 0);
          endDate = new Date(now.setDate(now.getDate() + (6 - now.getDay())));
          endDate.setUTCHours(23, 59, 59, 999);
          break;

        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setUTCHours(23, 59, 59, 999);
          break;

        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          endDate.setUTCHours(23, 59, 59, 999);
          break;

        default:
          return res
            .status(400)
            .json({ error: "Invalid period parameter or missing date range" });
      }
    }

    req.session.startDate = startDate;
    req.session.endDate = endDate;
    //get total revenue
    //get total coupon discount deductions
    //get total orders count
    console.log(startDate, endDate);
    const reportOverview = await getReportOverview(startDate, endDate);

    //get the all orders of this
    const allOrders = await getAllOrdersDetails(startDate, endDate);

    res.status(200).json({ reportOverview, allOrders });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// SAMPLE CODE FOR LEARNING
exports.downloadSalesReportPdf1 = async (req, res) => {
  try {
    const salesData = [
      { product: "Laptop", quantity: 2, price: 1000, total: 2000 },
      { product: "Mouse", quantity: 5, price: 20, total: 100 },
      { product: "Keyboard", quantity: 3, price: 50, total: 150 },
    ];

    // Render EJS Template
    const templatePath = path.join(
      __dirname,
      "../views/admin/reports/salesReportPdf.ejs"
    );
    const html = await ejs.renderFile(templatePath, {
      sales: salesData,
      reportDate: new Date().toLocaleDateString(),
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
      'attachment; filename="sales-report.pdf"'
    );
    res.end(pdfBuffer); // Correctly sends binary data
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};

exports.downloadSalesReportPdf = async (req, res) => {
  try {
    const startDate = req.session.startDate;
    const endDate = req.session.endDate;

    const reportOverview = await getReportOverview(startDate, endDate);
    const allOrders = await getAllOrdersDetails(startDate, endDate);

    // Render EJS Template
    const templatePath = path.join(
      __dirname,
      "../views/admin/reports/salesReportPdf.ejs"
    );
    const html = await ejs.renderFile(templatePath, {
      reportOverview,
      allOrders,
      reportDate: new Date().toLocaleDateString(),
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
      'attachment; filename="sales-report.pdf"'
    );
    res.end(pdfBuffer); // Correctly sends binary data
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};

exports.downloadSalesReportExcel = async (req, res) => {
  try {
    const startDate = req.session.startDate;
    const endDate = req.session.endDate;
    // validate thise

    // inint workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders Report");

    const reportOverview = await getReportOverview(startDate, endDate);
    const allOrders = await getAllOrdersDetails(startDate, endDate);

    const reportOverviewData = [
      [
        "Total Revenue",
        "Total Orders",
        "Total Products Sold",
        "Total discount deduction",
      ],
      [
        `₹${reportOverview.totalRevenue}`,
        reportOverview.totalOrders,
        reportOverview.totalSalesCount,
        `₹${reportOverview.totalCouponDiscount}`,
      ],
    ];

    // Add Report Overview Header
    const reportHeaderRow = worksheet.addRow(["Report Overview"]);
    worksheet.addRow([]);
    reportHeaderRow.font = { bold: true, size: 14 };
    reportHeaderRow.alignment = { vertical: "middle", horizontal: "center" };

    // Insert data as columns
    const headerRow = worksheet.addRow(reportOverviewData[0]);
    const valuesRow = worksheet.addRow(reportOverviewData[1]);

    worksheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 25 },
      { width: 25 },
    ];

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0078D7" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    valuesRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.addRow([]);
    worksheet.addRow([]);

    // orders table
    const ordersHeaderTitle = worksheet.addRow(["All Orders"]);
    ordersHeaderTitle.font = { bold: true, size: 14 };
    ordersHeaderTitle.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.addRow([]);
    const ordersHeaderRow = worksheet.addRow([
      "Order ID",
      "Customer",
      "Total Amount",
      "Total Products",
      "Payment Method",
    ]);

    ordersHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "28A745" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });

    allOrders.forEach((order) => {
      const row = worksheet.addRow([
        order.orderId,
        order.customerName,
        `₹${order.totalPayable.toFixed(2)}`,
        order.totalProducts,
        order.paymentMethod,
      ]);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Auto-adjust column widths
    worksheet.columns.forEach((column) => {
      column.width = 23;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Orders_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

    console.log("Excel file sent successfully!");
  } catch (error) {
    console.error("Error generating excel:", error);
    res.status(500).send("Error generating excel");
  }
};

// REPORT END

exports.getCouponManagement = (req, res) => {
  res.render("admin/coupons/couponManagement", {
    title: "Coupon Management",
    activePage: "coupons",
  });
};

// get all available coupons
// later make modification, how many users used the coupon
exports.getAllCoupons = async (req, res, next) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page) || 0;
    const limit = 5;
    const skip = page * limit;

    const pipeline = [
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          couponsCount: [{ $count: "total" }],
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    if (search) {
      const couponCode = search.trim();
      pipeline.unshift({
        $match: { couponCode: { $regex: couponCode, $options: "i" } },
      });
    }

    const result = await Coupons.aggregate(pipeline);

    const totalCoupons = result[0]?.couponsCount[0]?.total || 0;
    const coupons = result[0]?.paginatedResult;
    const hasMore = skip + coupons.length < totalCoupons;

    res.status(200).json({
      totalCoupons,
      coupons,
      hasMore,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// render add coupon page
exports.getNewCouponForm = (req, res) => {
  res.render("admin/coupons/newCoupon", {
    title: "Coupon Management - New Coupon",
    edit: false,
    activePage: "coupons",
  });
};

exports.saveNewCoupon = async (req, res, next) => {
  try {
    const {
      couponCode,
      discount,
      minOrderAmount,
      startDate,
      endDate,
      description,
    } = req.body;

    const existingCoupon = await Coupons.findOne({ couponCode });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code already exists!" });
    }

    const newCoupon = new Coupons({
      couponCode,
      discount,
      minOrderAmount,
      startDate,
      endDate,
      description,
    });

    await newCoupon.save();
    return res
      .status(201)
      .json({ success: true, message: "Coupon created successfully!" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// render edit coupon page
exports.getEditCouponForm = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      res.redirect("/admin/coupons");
    }

    const coupon = await Coupons.findById(id);
    if (!coupon) {
      res.redirect("/admin/coupons");
    }

    req.session.selectedCouponId = coupon._id;
    res.render("admin/coupons/newCoupon", {
      title: "Coupon Management - Edit Coupon",
      edit: true,
      activePage: "coupons",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/coupons");
  }
};

// get the details of coupon for edit
exports.getEditCouponDetails = async (req, res, next) => {
  try {
    const couponId = req.session.selectedCouponId;

    if (!couponId) {
      return res.status(400).json({ error: "Session Expired" });
    }

    const coupon = await Coupons.findById(couponId);
    if (!coupon) {
      return res.status(400).json({ error: "Coupon not found" });
    }

    return res
      .status(200)
      .json({ message: "Coupon fetched successfully", coupon });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// to save the updated coupon details
exports.saveUpdatedCoupon = async (req, res, next) => {
  try {
    const couponId = req.session.selectedCouponId;
    if (!couponId) {
      return res.status(400).json({ error: "Session expired" });
    }

    const coupon = await Coupons.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const {
      couponCode,
      discount,
      minOrderAmount,
      startDate,
      endDate,
      description,
    } = req.body;

    const existingCoupon = await Coupons.findOne({
      couponCode: couponCode,
      _id: { $ne: coupon._id },
    });

    if (existingCoupon) {
      return res.status(400).json({ error: "Coupon code already in use" });
    }

    coupon.couponCode = couponCode;
    coupon.discount = discount;
    coupon.minOrderAmount = minOrderAmount;
    coupon.startDate = startDate;
    coupon.endDate = endDate;
    coupon.description = description;

    await coupon.save();
    res.status(200).json({ message: "Coupon updated successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// to make the coupon active or inactive
exports.toogleCouponStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Select a coupon to delete" });
    }

    const coupon = await Coupons.findById(id);
    if (!coupon) {
      return res.status(400).json({ error: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;

    await coupon.save();
    res.status(200).json({ message: "Updated listing status" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
