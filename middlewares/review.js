const validateNewReview = async (req, res, next) => {
  const { rating, review } = req.body;

  console.log("Rating:", rating);
  console.log("Review:", review);

  if (!rating || !review) {
    return res.status(400).json("Add your rating and review");
  }

  const ratingValue = parseFloat(rating);
  if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return res
      .status(400)
      .json("Invalid rating. Rating must be a number between 1 and 5.");
  }

  if (review.length > 500) {
    return res
      .status(400)
      .json("Invalid review. Review must not exceed 500 characters.");
  }

  console.log("Review validation passed");
  return next();
};

module.exports = { validateNewReview };
