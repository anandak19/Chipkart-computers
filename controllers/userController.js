const CategoriesSchema = require("../models/Category");
const ProductSchema = require("../models/Product");
const mongoose = require("mongoose");

exports.getHome = (req, res) => {
  res.render("user/home");
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
    console.log(typeof pageNumber);

    let limit = 2;
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
    // Default -  sort my product name in asc----------------
    if (sortBy === "a-z") {
      sort.productNameLower = 1;
    } else if (sortBy == "z-a") {
      sort.productNameLower = -1;
    }

    if (isNew) {
      sort.createdAt = 1;
      limit = 10;
      skip = 0;
    }

    // Need to perform lookup with review collection for this
    // if (ratingsAbove) {
    //   filters.ratings = { $gte: Number(ratingsAbove) }
    // }

    const pipeline = [
      {
        $match: filters,
      },
      {
        $addFields: {
          productNameLower: { $toLower: "$productName" },
        },
      },
    ];

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

    console.log("filter is: ", filters);
    console.log("sort is:", sort);
    console.log("limit is:", limit);
    console.log("skip is", skip);

    res.json({ products, total, hasMore });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAccount = (req, res) => {
  res.render("user/account");
};
