const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");

const validateNewReview = async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    if (!rating || !review) {
      throw new CustomError(
        "Add your rating and review",
        STATUS_CODES.BAD_REQUEST
      );
    }

    const ratingValue = parseFloat(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      throw new CustomError(
        "Invalid rating. Rating must be a number between 1 and 5.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    if (review.length > 500) {
      throw new CustomError(
        "Invalid review. Review must not exceed 500 characters.",
        STATUS_CODES.BAD_REQUEST
      );
    }

    return next();
  } catch (error) {
    next(error)
  }
};

// Working on ...
// check if the user has bought this item, chck this user has added review for thsi item, return 2 boolians
const checkPurchaseAndReviewStatus = async (req, res, next) => {
  let isPurchase,
    isReview = false;
  try {
    const userId = req.session.userId;
    const productId = req.params.id;

    //  find the all orders made by user from orders collection by matching orderStatus as deliverd From orders collections
    // unwind all documents with each order has one item
    // return the names of all product Ids
    // Then check if the product in we are searching for is in the retured product ids,
    // if not redierect to that product page with the isPurchase flag , end the reqest

    // if product id iam searching for is thier then make the isPurchse true

    // now the second step : search the userReviews collection to find if thier is a document with our productId and userId
    // if the document is found. make the isReview true and return : isReview flag
  } catch (error) {
    // return the error message and the flag of isPurchase and isReview as false
  }
};

module.exports = { validateNewReview, checkPurchaseAndReviewStatus };
