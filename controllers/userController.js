const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");
const UserReviewsSchema = require("../models/UserReview");
const mongoose = require("mongoose");
const { calculateAverageRating } = require("../utils/helper");
const {
  getProductWithFinalPrice,
  addFinalPriceStage,
} = require("../utils/productHelpers");
const WishlistItems = require("../models/WishlistItems");
const Users = require("../models/User");
const { ObjectId } = require("mongoose").Types;

exports.getHome = (req, res) => {
  res.render("user/home");
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    /*
    find the products that are listed and featured is true
    return the all the products
    */
    // const featuredProducts = await ProductSchema.find({
    //   isListed: true,
    //   isFeatured: true,
    // });

    const featuredProducts = await ProductSchema.aggregate([
      {
        $match: { isListed: true, isFeatured: true },
      },
      addFinalPriceStage,
    ]);

    res.status(200).json({
      success: true,
      data: featuredProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching featured products",
    });
  }
};

// get latest products
exports.getLatestProducts = async (req, res) => {
  try {
    /*
    find the products that are listed
    sort the product based on createdAt : -1
    limit the count of products to 10
    return the the products
    */

    const latestProducts = await ProductSchema.aggregate([
      {
        $match: { isListed: true },
      },
      addFinalPriceStage,
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: latestProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching latest products",
    });
  }
};

// get all products page
exports.getProductsPage = async (req, res) => {
  try {
    //  // getting category to show category names on view
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
    //  res.json(products)
    res.render("user/productPage", { categoryArray });
  } catch (error) {
    console.log(error);
  }
};

exports.getAvailableProducts = async (req, res) => {
  try {
    const { categoryId, priceOrder, ratingsAbove, sortBy } = req.query;

    const filters = { isListed: true };
    const sort = {};

    let { isFeatured, isNew } = req.query;
    isFeatured = isFeatured === "true";
    isNew = isNew === "true";

    const { page = "0" } = req.query;
    const pageNumber = parseInt(page, 10) || 0;

    let limit = 5;
    let skip = pageNumber * limit;

    if (isFeatured) {
      filters.isFeatured = isFeatured;
    }

    // filter by category id
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    // Default - sort price in ascending----------------
    if (priceOrder) {
      sort.finalPrice = priceOrder === "desc" ? -1 : 1;
    }
    // sort by name of product
    if (sortBy === "a-z") {
      sort.productNameLower = 1;
    } else if (sortBy == "z-a") {
      sort.productNameLower = -1;
    }

    // if new products only is asked
    if (isNew) {
      sort.createdAt = 1;
      limit = 10;
      skip = 0;
    }

    // --declare the pipeline
    const pipeline = [
      {
        $match: filters,
      },
      {
        $addFields: {
          productNameLower: { $toLower: "$productName" },
          productIdStr: { $toString: "$_id" },
        },
      },
    ];

    // -- to join with the review collection
    pipeline.push({
      $lookup: {
        from: "userreviews",
        localField: "productIdStr",
        foreignField: "productId",
        as: "productReviews",
      },
    });

    // --to find the avarage rating
    pipeline.push({
      $addFields: {
        averageRating: {
          $cond: {
            if: { $gt: [{ $size: "$productReviews" }, 0] },
            then: {
              $divide: [
                { $sum: "$productReviews.rating" },
                { $size: "$productReviews" },
              ],
            },
            else: 0,
          },
        },
      },
    });

    // --to remove unnessasary fields
    pipeline.push({
      $project: {
        _id: 1,
        productReviews: 0,
        productIdStr: 0,
        description: 0,
        highlights: 0,
      },
    });

    // if ratings above is asked
    if (ratingsAbove) {
      const rating = parseFloat(ratingsAbove);
      pipeline.push({
        $match: {
          averageRating: { $gt: rating },
        },
      });
    }

    if (sort && Object.keys(sort).length > 0) {
      pipeline.push({
        $sort: sort,
      });
    }

    // Add skip and limit stages for pagination
    pipeline.push({
      $facet: {
        productCount: [{ $count: "total" }],
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const result = await ProductSchema.aggregate(pipeline);

    const productCount = result[0].productCount[0];
    const products = result[0].paginatedResults;

    const total = productCount ? productCount.total : 0;
    const hasMore = skip + products.length < total;

    // console.log("filter is: ", filters);
    // console.log("sort is:", sort);
    // console.log("limit is:", limit);
    // console.log("skip is", skip);

    res.json({ products, total, hasMore });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// WORKING..
exports.getAvailableProducts2 = async (req, res) => {
  try {
    const { categoryId, priceOrder, ratingsAbove, sortBy, search } = req.query;
    console.log(search);

    const filters = { isListed: true };
    const sort = {};
    let pipeline = [
    ];

    let { isFeatured, isNew } = req.query;
    isFeatured = isFeatured === "true";
    isNew = isNew === "true";

    const { page = "0" } = req.query;
    const pageNumber = parseInt(page, 10) || 0;

    let limit = 5;
    let skip = pageNumber * limit;

    if (isFeatured) {
      filters.isFeatured = isFeatured;
    }

    // filter by category id
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    // Default - sort price in ascending----------------
    if (priceOrder) {
      sort.finalPrice = priceOrder === "desc" ? -1 : 1;
    }
    // sort by name of product
    if (sortBy === "a-z") {
      sort.productNameLower = 1;
    } else if (sortBy == "z-a") {
      sort.productNameLower = -1;
    }

    // if new products only is asked
    if (isNew) {
      sort.createdAt = 1;
      limit = 5;
      skip = 0;
    }

    if (search) {
      const query = search.trim();
      pipeline.push({
        $match: { $text: { $search: search } },
      });
    }
    pipeline.push({
      $match: filters,
    });

    pipeline.push({
      $addFields: {
        productNameLower: { $toLower: "$productName" },
        productIdStr: { $toString: "$_id" },
      },
    });

    // -- to join with the review collection
    pipeline.push({
      $lookup: {
        from: "userreviews",
        localField: "productIdStr",
        foreignField: "productId",
        as: "productReviews",
      },
    });

    // --to find the avarage rating
    pipeline.push({
      $addFields: {
        averageRating: {
          $cond: {
            if: { $gt: [{ $size: "$productReviews" }, 0] },
            then: {
              $divide: [
                { $sum: "$productReviews.rating" },
                { $size: "$productReviews" },
              ],
            },
            else: 0,
          },
        },
      },
    });

    // add final price
    pipeline.push(addFinalPriceStage);

    // --to remove unnessasary fields
    pipeline.push({
      $project: {
        _id: 1,
        productReviews: 0,
        productIdStr: 0,
        description: 0,
        highlights: 0,
      },
    });

    // if ratings above is asked
    if (ratingsAbove) {
      const rating = parseFloat(ratingsAbove);
      pipeline.push({
        $match: {
          averageRating: { $gt: rating },
        },
      });
    }

    if (sort && Object.keys(sort).length > 0) {
      pipeline.push({
        $sort: sort,
      });
    }

    // add wishlist true if product is wishlisted
    const userId = req.session?.user?.id || null;
    if (userId) {
      const userId = req.session.user.id;
      pipeline.push(
        {
          $lookup: {
            from: "wishlistitems",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$productId", "$$productId"] },
                      { $eq: ["$userId", userId] },
                    ],
                  },
                },
              },
            ],
            as: "wishlistData",
          },
        },
        {
          $addFields: {
            isWishlisted: { $gt: [{ $size: "$wishlistData" }, 0] },
          },
        },
        {
          $project: { wishlistData: 0 },
        }
      );
    }

    // Add skip and limit stages for pagination
    pipeline.push({
      $facet: {
        productCount: [{ $count: "total" }],
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const result = await ProductSchema.aggregate(pipeline);

    const productCount = result[0].productCount[0];
    const products = result[0].paginatedResults;

    const total = productCount ? productCount.total : 0;
    const hasMore = skip + products.length < total;

    // console.log("filter is: ", filters);
    // console.log("sort is:", sort);
    // console.log("limit is:", limit);
    // console.log("skip is", skip);

    res.json({ products, total, hasMore });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// render the product details page with its detials
exports.getProductDetailsPage = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(404).json({ error: "Choose a product first" });
    }
    const product = await getProductWithFinalPrice(productId);

    product.isWishlisted = false;
    const userId = req.session?.user?.id || null;
    if (userId) {
      const wishlistItem = await WishlistItems.findOne({
        productId,
        userId: req.session.user.id,
      });
      if (wishlistItem) {
        product.isWishlisted = true;
      }
    }

    res.render("user/productDetailPage", { product });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

exports.getAddReviewForm = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log("Product ID for review:", productId);
    if (!productId) {
      return res.status(404).send("Id not found");
    }

    const productDetails = await ProductSchema.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $project: {
          productName: 1,
          images: { $slice: ["$images", 1] },
        },
      },
      {
        $unwind: "$_id",
      },
    ]);

    if (!productDetails) {
      console.log("Product not found for review");
      return res.status(404).send("Product not found");
    }

    const product = productDetails[0] || null;

    res.render("user/addReview", { product });
  } catch (error) {
    console.error("Error loading review form:", error);
    return res.status(500).send("Internal server error");
  }
};

// update need
exports.postAddReviewForm = async (req, res) => {
  console.log("Product ID:", req.params.id);
  console.log("Attempting to post a review");

  try {
    console.log(req.body);
    const { rating, review } = req.body;
    const userId = req.session?.userId;
    const productId = req.params?.id;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "Invalid user or product information" });
    }

    if (!rating || !review) {
      return res
        .status(400)
        .json({ message: "Rating and review are required" });
    }

    const newReview = new UserReviewsSchema({
      productId,
      userId,
      review,
      rating,
    });

    const savedReview = await newReview.save();
    console.log(savedReview);

    if (savedReview) {
      return res
        .status(201)
        .json({ message: "Review saved successfully", review: savedReview });
    } else {
      return res.status(500).json({ message: "Failed to save the review" });
    }
  } catch (error) {
    console.error("Error while saving review:", error);
    return res.status(500).json({
      message: "An error occurred while posting the review",
      error: error.message,
    });
  }
};

exports.getReviews = async (req, res) => {
  /*
  find the all the reviews of the product in reviews collections
  if the reviews are found, return in the order of last added first
  use pagination - 3 is the limit default page = 0
  */
  try {
    console.log("finding revius of product id-- ", String(req.productId));
    const { page = "0" } = req.query;
    const pageNumber = parseInt(page, 10) || 0;
    let limit = 3;
    let skip = pageNumber * limit;

    //268

    // here , it will find the revies made by user by joining the users collection to get users name
    const result = await UserReviewsSchema.aggregate([
      {
        $match: {
          productId: String(req.productId),
        },
      },
      {
        $addFields: {
          userIdAsObjectId: { $toObjectId: "$userId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userIdAsObjectId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          reviewCount: [{ $count: "total" }],
          paginatedResults: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    const reviewCount = result[0]?.reviewCount[0]?.total || 0;
    const reviews = result[0]?.paginatedResults || [];
    const hasMore = skip + reviews.length < reviewCount;

    const averageRating = await calculateAverageRating(String(req.productId));

    res.status(200).json({
      status: "success",
      message: "Data fetched successfully",
      data: {
        reviews,
        totalReviews: reviewCount,
        hasMore,
        averageRating,
      },
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.getRelatedProducts = async (req, res) => {
  /*
  find the product by its id from db
  get the category of that product
  find all the product with that category except the current product
  limit the count to 10
  return the related products
  */

  try {
    const currentProduct = await ProductSchema.findById(req.productId);
    if (!currentProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const { categoryId } = currentProduct;

    const relatedProducts = await ProductSchema.aggregate([
      {
        $match: {
          categoryId: categoryId,
          _id: { $ne: currentProduct._id },
          isListed: true,
        },
      },
      {
        $limit: 10,
      },
      addFinalPriceStage,
    ]);

    res.status(200).json({
      success: true,
      data: relatedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching related products",
    });
  }
};

exports.getTopCategories = async (req, res, next) => {
  try {
    const topCategories = await CategoriesSchema.aggregate([
      {
        $match: { isListed: true },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $limit: 5,
      },
    ]);

    console.log(topCategories);
    res.status(200).json({ topCategories });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getWishListPage = (req, res) => {
  res.render("user/account/wishlist");
};

exports.getWishlistCount = async (req, res, next) => {
  try {
    const loggedInUser = req.session.user;
    if (!loggedInUser) {
      return res.status(200).json({ count: 0 });
    }

    const wishlist = await WishlistItems.find({ userId: loggedInUser.id });

    if (!wishlist) {
      return res.status(200).json({ count: 0 });
    }

    const itemCount = wishlist.length;

    return res.status(200).json({ count: itemCount });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.addWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const productId = req.productId;
    if (!userId || !productId) {
      return res.status(400).json({ error: "Error geting user or product" });
    }

    const existingItem = await WishlistItems.findOne({ userId, productId });

    if (existingItem) {
      const deletedItem = await WishlistItems.findOneAndDelete({
        userId,
        productId,
      });
      return res.status(200).json({ message: "Item removed from wishlist" });
    }

    const newWishlistItem = new WishlistItems({
      userId,
      productId,
    });

    const savedItem = await newWishlistItem.save();
    if (!savedItem) {
      return res
        .status(400)
        .json({ error: "Error adding product to wishlist" });
    }

    res.status(200).json({ message: "Added to wishlist" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getWishlistItems = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Number(req.query.page) || 0;
    const limit = 5;
    const skip = limit * page;

    if (!userId) {
      return res.status(400).json({ error: "Error geting user" });
    }

    const result = await WishlistItems.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$productDetails", "$$ROOT"] },
        },
      },
      {
        $project: { productDetails: 0 },
      },
      addFinalPriceStage,
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "total" }],
        },
      },
    ]);

    const productsCount = result[0]?.total[0]?.total || 0;
    const products = result[0]?.paginatedResult || [];
    const hasMore = skip + products.length < productsCount;

    res.status(200).json({ productsCount, products, hasMore });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
