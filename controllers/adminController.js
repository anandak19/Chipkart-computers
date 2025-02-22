const UserSchema = require("../models/User");
const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");
const OrderSchema = require("../models/Order");
const AddressSchema = require("../models/Address");
const { getOrderItemsDetails } = require("../utils/orderManagement");
const OrderItem = require("../models/orderItem");
const mongoose = require("mongoose");
const Coupons = require("../models/Coupon");
const { getCategories } = require("../utils/categoryHelpers");
const Offer = require("../models/Offer");
const { addFinalPriceStage } = require("../utils/productHelpers");
const Categories = require("../models/Category");
const Session = mongoose.connection.collection("sessions");

exports.getDashboard = (req, res) => {
  res.render("admin/dashbord", { title: "Admin Dashboard" });
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

    let newImages = [];
    console.log(product.isFeatured);

    if (positions) {
      positions = positions
        .filter(
          (pos) =>
            pos !== undefined && pos !== null && pos !== "" && !isNaN(pos)
        )
        .map((pos) => parseInt(pos));
    }

    if (req.files && req.files.length > 0) {
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
    console.log("updated product: ", product);
    res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteSingleProductImage = async (req, res, next) => {
  try {
    const productId = req.session.selectedProductId;
    if (!productId) {
      return res.status(400).json({ error: "Session expired" });
    }

    const product = await ProductSchema.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found in the system" });
    }

    const { id: imageId } = req.params;

    const imageIndex = product.images.findIndex(
      (img) =>
        img._id.toString() === new mongoose.Types.ObjectId(imageId).toString()
    );
    console.log("index", imageIndex);

    product.images[imageIndex].filename = null;
    product.images[imageIndex].filepath = null;

    console.log("new product", product);

    await product.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
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
    res.render("admin/categoryManagement", {
      title: "Category Management",
      categoriesArray,
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
  res.render("admin/formCategory", {
    title: "Category Management - New",
    errorMessage: req.flash("errorMessage"),
    successMessage: req.flash("successMessage"),
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
  res.render("admin/offerModule", { title: "Offer Module" });
};

exports.getNewOfferForm = (req, res) => {
  res.render("admin/offerForm", {
    title: "Offer Module - New Offer",
    edit: false,
  });
};

exports.applyNewOffer = async (req, res, next) => {
  try {
    const { offerTitle, discount, target, categoryId, startDate, endDate } =
      req.body;
    const newDiscount = parseInt(discount);

    let category;

    if (target === "category") {
      category = await CategoriesSchema.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    // create new offer
    const newOffer = new Offer({
      offerTitle,
      discount,
      target,
      categoryId: category._id,
      startDate,
      endDate,
    });

    // save new offer
    const savedOffer = await newOffer.save();
    if (!savedOffer) {
      return res.status(404).json({ error: "Faild to create new offer" });
    }

    // if the target is category,
    if (target === "category") {
      const result = await ProductSchema.updateMany(
        { categoryId: categoryId, discount: { $lt: newDiscount } },
        [
          {
            $set: {
              discount: newDiscount,
              offerStartDate: startDate,
              offerEndDate: endDate,
              offerId: savedOffer._id,
            },
          },
        ]
      );

      if (result.modifiedCount <= 0) {
        return res.status(400).json({
          error: "This category already going through a bigger offer than this",
        });
      }
    } else if (target === "all") {
      const result = await ProductSchema.updateMany(
        { discount: { $lt: newDiscount } },
        [
          {
            $set: {
              discount: newDiscount,
              offerStartDate: startDate,
              offerEndDate: endDate,
              offerId: savedOffer._id,
            },
          },
        ]
      );

      if (result.modifiedCount <= 0) {
        return res.status(400).json({
          error:
            "All products are already going through a bigger offer than this",
        });
      }
    } else {
      return res.status(400).json({
        error: "No Offer applied",
      });
    }

    return res.status(200).json({
      message: "Offer applied successfully",
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

    res.render("admin/offerForm", {
      title: "Offer Module - Edit Offer",
      edit: true,
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
    }else{
      offer.category = 'All'
    }

    return res.status(200).json({ offer });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

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
    const active = offer.isActive
    await offer.save();


    await ProductSchema.updateMany(
      { offerId: offer._id },
      {
        $set: {
          discount: active ? offer.discount: 0,
          offerStartDate: active ? offer.startDate : null,
          offerEndDate: active ? offer.endDate : null,
        },
      }
    );

    return res.status(200).json({
      message: "Offer status updated successfully",
    });

  } catch (error) {
    console.log(error)
    next(error)
  }
}
// ----------offer management end--------

// -------------ORDER MANAGMENT START
exports.getOrderManagement = (req, res) => {
  res.render("admin/orderManagement", { title: "Order Management" });
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

    if (status === "Delivered") {
      order.deliveryDate = new Date();
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

    res.render("admin/orderDetails", { title: "Order Details", orderDetails });
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
    const orderDetails = await OrderSchema.findById(orderId);
    if (!orderDetails) {
      return res.status(400).json({ error: "Order not found" });
    }

    orderDetails.isCancelled = true;
    orderDetails.orderStatus = "Cancelled";
    orderDetails.cancelReason = cancelReason;

    await orderDetails.save();

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

    orderItem.isReturned = true;
    await orderItem.save();

    res.status(200).json({ message: "Return approved successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -------------ORDER MANAGMENT END

exports.getSalesReport = (req, res) => {
  res.render("admin/salesReport", { title: "Sales Report" });
};

exports.getCouponManagement = (req, res) => {
  res.render("admin/couponManagement", { title: "Coupon Management" });
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
  res.render("admin/newCoupon", {
    title: "Coupon Management - New Coupon",
    edit: false,
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
    res.render("admin/newCoupon", {
      title: "Coupon Management - Edit Coupon",
      edit: true,
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
