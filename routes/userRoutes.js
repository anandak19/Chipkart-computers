const express = require('express')
const userController = require('../controllers/userController')
const userAccountController = require('../controllers/userAccountController')
const { isLogin } = require('../middlewares/userAuth')
const { validateProduct } = require('../middlewares/productValidation')
const { validateNewReview } = require('../middlewares/review')


const router = express.Router()

router.use(express.json())
router.use(express.urlencoded({extended: true}))

router.get('/', userController.getHome)
// get featured products 
router.get('/products/featured', userController.getFeaturedProducts)
// get latest products 
router.get('/products/latest', userController.getLatestProducts)
// render all product page with Categories 
router.get('/products', userController.getProductsPage)
// api to get available products with optional filters and pagiantion 
router.get('/products/p', userController.getAvailableProducts2)
// api to get product details page 
router.get('/products/:id', userController.getProductDetailsPage)
// render add review page           isLogin,
router.get('/products/:id/review/new', isLogin,  userController.getAddReviewForm)
// check if the user was already given review -  TEST THIS ROUTE AFTER LOGIN IN !!
router.post('/products/:id/review/new',isLogin, validateProduct, validateNewReview, userController.postAddReviewForm)
// get all the reviews of a product 
router.get('/products/:id/review', validateProduct, userController.getReviews)
// get related products 
router.get('/products/:id/related', validateProduct, userController.getRelatedProducts)



// ---user account based routes--- 
router.get('/account', isLogin, userAccountController.getAccount)

module.exports = router