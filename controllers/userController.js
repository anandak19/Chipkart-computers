const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");
const UserReviewsSchema = require("../models/UserReview");
const mongoose = require("mongoose");
require('dotenv').config()
const { calculateAverageRating } = require("../utils/helper");
const {
  getProductWithFinalPrice,
  addFinalPriceStage,
} = require("../utils/productHelpers");
const WishlistItems = require("../models/WishlistItems");
const Users = require("../models/User");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");
const { ObjectId } = require("mongoose").Types;

exports.getHome = (req, res) => {

  const referralCode = req.query.ref; 
  if (referralCode) {
    console.log("Saving the referal code: ", referralCode)
    res.cookie("referralCode", referralCode, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    })
  }

  res.render("user/home");
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {

    const featuredProducts = await ProductSchema.aggregate([
      {
        $match: { isListed: true, isFeatured: true },
      },
      addFinalPriceStage,
    ]);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: featuredProducts,
    });
  } catch (error) {
    next(error)
  }
};

// get latest products
exports.getLatestProducts = async (req, res, next) => {
  try {

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

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: latestProducts,
    });
  } catch (error) {
    next(error)
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
    res.render("user/productPage", { categoryArray });
  } catch (error) {
    console.log(error);
    res.redirect('/')
  }
};

// WORKING..
exports.getAvailableProducts2 = async (req, res, next) => {
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

    res.status(STATUS_CODES.SUCCESS).json({ products, total, hasMore });
  } catch (error) {
    next(error)
  }
};

// render the product details page with its detials
exports.getProductDetailsPage = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      throw new CustomError( "Choose a product first", STATUS_CODES.BAD_REQUEST);
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
    next(error)
  }
};

exports.getAddReviewForm = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      res.redirect('/products/p')
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
      res.redirect('/products/p')
    }

    const product = productDetails[0] || null;

    res.render("user/addReview", { product });
  } catch (error) {
    next(error)
  }
};

// update need
exports.postAddReviewForm = async (req, res, next) => {

  try {
    console.log(req.body);
    const { rating, review } = req.body;
    const userId = req.session?.userId;
    const productId = req.params?.id;

    if (!userId || !productId) {
      throw new CustomError( "Invalid user or product information", STATUS_CODES.BAD_REQUEST);
    }

    if (!rating || !review) {
      throw new CustomError( "Rating and review are required", STATUS_CODES.BAD_REQUEST);
    }

    const newReview = new UserReviewsSchema({
      productId,
      userId,
      review,
      rating,
    });

    const savedReview = await newReview.save();

    if (savedReview) {
      return res
        .status(STATUS_CODES.CREATED)
        .json({ message: "Review saved successfully", review: savedReview });
    } else {
      throw new CustomError( "Failed to save the review", STATUS_CODES.BAD_REQUEST);
    }
  } catch (error) {
    next(error)
  }
};

exports.getReviews = async (req, res, next) => {
  try {
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

    res.status(STATUS_CODES.SUCCESS).json({
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
    next(error)
  }
};

exports.getRelatedProducts = async (req, res, next) => {
  try {
    const currentProduct = await ProductSchema.findById(req.productId);
    if (!currentProduct) {
      throw new CustomError( "Product not found", STATUS_CODES.NOT_FOUND);
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

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: relatedProducts,
    });
  } catch (error) {
    next(error)
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
    res.status(STATUS_CODES.SUCCESS).json({ topCategories });
  } catch (error) {
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
      return res.status(STATUS_CODES.SUCCESS).json({ count: 0 });
    }

    const wishlist = await WishlistItems.find({ userId: loggedInUser.id });

    if (!wishlist) {
      return res.status(STATUS_CODES.SUCCESS).json({ count: 0 });
    }

    const itemCount = wishlist.length;

    return res.status(STATUS_CODES.SUCCESS).json({ count: itemCount });
  } catch (error) {
    next(error);
  }
};

exports.addWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const productId = req.productId;
    if (!userId || !productId) {
      throw new CustomError( "Error geting user or product", STATUS_CODES.BAD_REQUEST);
    }

    const existingItem = await WishlistItems.findOne({ userId, productId });

    if (existingItem) {
      const deletedItem = await WishlistItems.findOneAndDelete({
        userId,
        productId,
      });
      return res.status(STATUS_CODES.SUCCESS).json({ message: "Item removed from wishlist" });
    }

    const newWishlistItem = new WishlistItems({
      userId,
      productId,
    });

    const savedItem = await newWishlistItem.save();
    if (!savedItem) {
      throw new CustomError( "Error adding product to wishlist", STATUS_CODES.BAD_REQUEST);
    }

    res.status(STATUS_CODES.SUCCESS).json({ message: "Added to wishlist" });
  } catch (error) {
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
      throw new CustomError( "Error geting user", STATUS_CODES.BAD_REQUEST);
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

    res.status(STATUS_CODES.SUCCESS).json({ productsCount, products, hasMore });
  } catch (error) {
    next(error);
  }
};
