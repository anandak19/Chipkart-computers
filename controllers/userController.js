const CategoriesSchema = require("../models/Category");

exports.getHome = (req, res) => {
  res.render("user/home");
};

// get all products page 
exports.getProductsPage = async(req, res) => {
  try {
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

    res.render("user/productPage", {categoryArray});
  } catch (error) {
    console.log(error);
  }
};

exports.getAccount = (req, res) => {
  res.render("user/account");
};
