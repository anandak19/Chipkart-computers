const UserSchema = require("../models/User");
const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");
const OrderSchema = require("../models/Order");
const AddressSchema = require("../models/Address");
const { getOrderItemsDetails } = require("../utils/orderManagement");

exports.getDashboard = (req, res) => {
  res.render("admin/dashbord", { title: "Admin Dashboard" });
};

// -----user management start------
// render user management page
exports.getUserManagementPage = async (req, res) => {
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
    console.log(result[0]);
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
    const discount = parseFloat(req.body.discount);
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
    const discount = parseFloat(req.body.discount);
    const finalPrice = parseFloat(req.body.finalPrice);
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
    if (discount !== undefined && discount !== null) {
      product.discount = discount;
    }
    if (finalPrice !== undefined && finalPrice !== null) {
      product.finalPrice = finalPrice;
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

exports.postCategoryForm = async (req, res) => {
  try {
    const categoryName = req.body?.categoryName?.trim() || "";
    const isListed = req.body?.isListed;

    if (!categoryName || !isListed) {
      req.flash("errorMessage", "Please enter the values");
      return res.redirect("/admin/categories/new");
    }

    const existingCategory = await CategoriesSchema.findOne({
      categoryName: { $regex: new RegExp("^" + categoryName + "$", "i") },
    });
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

    const existingCategory = await CategoriesSchema.findOne({
      categoryName: { $regex: new RegExp("^" + categoryName + "$", "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      req.flash(
        "errorMessage",
        "Category with same name exists. Please try another name"
      );
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
            orderId: { $regex: query, $options: "i" }
          }
        });
      }
  
      pipeline.push({
        $facet: {
          ordersCount: [{ $count: "total" }],
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
        },
      });
  
      const result = await OrderSchema.aggregate(pipeline);
  
      const totalorders = result[0]?.ordersCount[0]?.total || 0;
      console.log(result[0]);
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
    const {  orderId, status } = req.body
    const validStatuses = ["Ordered", "Shipped", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await OrderSchema.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.orderStatus = status;
    await order.save(); 

    res.status(200).json({ success: true, message: "Order status updated successfully" });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


exports.renderOrderDetailsPage = async (req, res) => {
  try {
    const {orderId} = req.params 

    if (!orderId) {
      res.redirect('/orders/all')
    }

    const orderDetails = await OrderSchema.findById(orderId)
    if (!orderDetails) {
      res.redirect('/orders/all')
    }

    req.session.orderId = orderDetails._id

    res.render("admin/orderDetails", { title: "Order Details", orderDetails });

  } catch (error) {
    console.log(error)
    res.redirect('/orders/all')
  }
}

// get user detail with id 
exports.getUserDataAndDeliveryInfo = async (req, res) => {
  try {
    const orderId = req.session.orderId
    if (!orderId) {
      return res.status(400).json({error: 'Session expired'})
    }
    const order = await OrderSchema.findById(orderId)
    if (!order) {
      return res.status(404).json({error: 'Order not found'})
    }
    console.log(order.userId)

    const user = await UserSchema.findById(order.userId)
    if (!user) {
      return res.status(404).json({error: 'User not found'})
    }

    const address = await AddressSchema.findById(order.addressId)
    if (!address) {
      return res.status(404).json({error: 'Address not found'})
    }

    res.status(200).json({user, address})
    
  } catch (error) {
    console.log(error)
    res.status(500).json({error: 'Internal server error'})
  }
}

exports.getOrderItems = async (req, res) => {
  try {
    const orderId = req.session.orderId
    if (!orderId) {
      return res.status(400).json({error: 'Session expired'})
    }
    const orderDetails = await OrderSchema.findById(orderId)
    const items = orderDetails.items

    console.log("The result")
    if (!orderDetails) {
      return res.status(404).json({error: 'Order not found or faild to join'})
    }

    res.status(200).json({items})
    
  } catch (error) {
    console.log(error)
    res.status(500).json({error: 'Internal server error'})
  }
}


// get order items 

// -------------ORDER MANAGMENT END


exports.getSalesReport = (req, res) => {
  res.render("admin/salesReport", { title: "Sales Report" });
};

exports.getCouponManagement = (req, res) => {
  res.render("admin/couponManagement", { title: "Coupon Management" });
};
