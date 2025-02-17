
const validateCouponDetails = async(req, res, next) => {
    try {
        const {
            couponCode,
            discount,
            minOrderAmount,
            expirationDate,
            description,
            couponStatus,
          } = req.body;

          if (!couponCode || couponCode.length !== 5) {
            return res.status(400).json({error: "Coupon code must have 5 charecters only"})
          }

          if (!discount || discount <= 0 || discount > 100 ) {
            return res.status(400).json({error: "Discount must be a positive number less than 100"})
          }

          if(!minOrderAmount || minOrderAmount <= 0){
            return res.status(400).json({error: "Minimum order amount must be greater than 0."})
          }

          const today = new Date();
          const selectedDate = new Date(expirationDate);
          if (!expirationDate || selectedDate <= today) {
            return res.status(400).json({error: "Expiration date must be in the future."})
          }

          if (!description || description.length < 10) {
            return res.status(400).json({error: "Description must be at least 10 characters."})
          }

          if (!couponStatus) {
            return res.status(400).json({error: "Please select a status."})
          }

          return next()
        
    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports = { validateCouponDetails }