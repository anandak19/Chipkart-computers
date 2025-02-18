
const validateCouponDetails = async(req, res, next) => {
    try {
        const {
            couponCode,
            discount,
            minOrderAmount,
            startDate,
            endDate,
            description,
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

          if (!description || description.length < 10) {
            return res.status(400).json({error: "Description must be at least 10 characters."})
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0); 
        
          const start = new Date(startDate);
          const end = new Date(endDate);
        
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
          }

          if (start < today) {
            return res.status(400).json({ error: "Start date must be today or a future date" });
          }

          if (end <= today) {
            return res.status(400).json({ error: "End date must be a future date" });
          }

          if (end <= start) {
            return res.status(400).json({ error: "End date must be after the start date" });
          }


          return next()
        
    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports = { validateCouponDetails }