const UserReviewsSchema = require('../models/UserReview')

const calculateAverageRating = async(productId) => {
    const ratings = await UserReviewsSchema.find({productId}).select('rating')
    if (ratings.length === 0 ) return 0
    const total = ratings.reduce((sum, {rating}) => rating + sum, 0)
    return (total / ratings.length).toFixed(1);
}


module.exports = { calculateAverageRating };