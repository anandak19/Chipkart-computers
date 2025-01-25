const express = require('express')
const userController = require('../controllers/userController')
const { isLogin } = require('../middlewares/userAuth')


const router = express.Router()

router.get('/', userController.getHome)
// render all product page with Categories 
router.get('/products', userController.getProductsPage)
// api to get available products with optional filters and pagiantion 
router.get('/products/p', userController.getAvailableProducts)
// api to get product details page 
router.get('/products/:id', userController.getProductDetailsPage)
// render add review page 
router.get('/products/:id/review', userController.getAddReviewForm)

// get user personal details page 
router.get('/account', isLogin, userController.getAccount)

module.exports = router