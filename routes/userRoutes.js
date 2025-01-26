const express = require('express')
const userController = require('../controllers/userController')
const { isLogin } = require('../middlewares/userAuth')
const { validateProduct } = require('../middlewares/productValidation')
const { validateNewReview } = require('../middlewares/review')


const router = express.Router()

router.use(express.json())
router.use(express.urlencoded({extended: true}))

router.get('/', userController.getHome)
// render all product page with Categories 
router.get('/products', userController.getProductsPage)
// api to get available products with optional filters and pagiantion 
router.get('/products/p', userController.getAvailableProducts)
// api to get product details page 
router.get('/products/:id', userController.getProductDetailsPage)
// render add review page 
router.get('/products/:id/review', userController.getAddReviewForm)
// check if the user was already given review 
router.post('/products/:id/review',validateProduct, validateNewReview, userController.postAddReviewForm)
// router.post('/products/review', validateNewReview)


// get user personal details page 
router.get('/account', isLogin, userController.getAccount)

module.exports = router