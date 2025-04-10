const express = require('express')
const userController = require('../controllers/userController')
const userAccountController = require('../controllers/userAccountController')
const userOrderController = require('../controllers/userOrderController')
const { isLogin, varifyLoginUserSession, getUser, checkIsblocked } = require('../middlewares/userAuth')
const { validateProduct, checkProductAvailability } = require('../middlewares/productValidation')
const { validateNewReview } = require('../middlewares/review')
const { validateAddressFields } = require('../middlewares/accountValidators')
const { compareOrderItems } = require('../middlewares/orderValidations')


const router = express.Router()

router.use(express.json())
router.use(express.urlencoded({extended: true}))

router.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
})

router.get('/', userController.getHome)
// get featured products 
router.get('/products/featured', userController.getFeaturedProducts)
// get latest products 
router.get('/products/latest', userController.getLatestProducts)
// render all product page with Categories 
router.get('/products', userController.getProductsPage)
// api to get available products with optional filters and pagiantion 
router.get('/products/p', userController.getAvailableProducts)
// api to get product details page 
router.get('/products/:id', userController.getProductDetailsPage)
// render add review page           isLogin,
router.get('/products/:id/review/new', isLogin,  userController.getAddReviewForm)
// check if the user was already given review -  TEST THIS ROUTE AFTER LOGIN IN !!
router.post('/products/:id/review/new',varifyLoginUserSession, validateProduct, validateNewReview, userController.postAddReviewForm)
// get all the reviews of a product 
router.get('/products/:id/review', validateProduct, userController.getReviews)
// get related products 
router.get('/products/:id/related', validateProduct, userController.getRelatedProducts)
// get top category images 
router.get('/category/top', userController.getTopCategories)
// add to wishlist
router.get('/account/wishlist', isLogin, userController.getWishListPage)
router.get('/wishlist/count', userController.getWishlistCount)
router.get('/account/wishlist/all', varifyLoginUserSession, userController.getWishlistItems)
router.post('/products/wishlist/add/:id', varifyLoginUserSession, validateProduct, userController.addWishlist)

// ---user account based routes--- 
// personal details 
router.get('/account', isLogin,  userAccountController.getAccount)
router.get('/account/user', varifyLoginUserSession, userAccountController.getUserDetails)
router.patch('/account/user', varifyLoginUserSession, userAccountController.postUserDetails)
router.patch('/account/user/password', varifyLoginUserSession, userAccountController.postChangePassword)


// user address 
router.get('/account/address', isLogin, userAccountController.getAddresses)
router.get('/account/address/all', varifyLoginUserSession, userAccountController.getUsersAllAddress)
router.get('/account/address/new', isLogin, userAccountController.getAddressForm)
router.post('/account/address/new', varifyLoginUserSession, validateAddressFields, userAccountController.addAddress)
router.delete('/account/address/:id', varifyLoginUserSession, userAccountController.deleteAddress)
router.get('/account/address/edit/:id', varifyLoginUserSession, userAccountController.getEditAddressPage) //working
router.get('/account/address/address-details', varifyLoginUserSession, userAccountController.getAddressDetails) //working
// clint side is not added
router.patch('/account/address/edit', varifyLoginUserSession, validateAddressFields, userAccountController.saveEditedAddress) // clint side is not completed
router.patch('/account/address/toogle/:id', varifyLoginUserSession, userAccountController.toggleAddress)

// ORDERS ROUTES START ---isLogin
router.get('/account/orders', isLogin, userAccountController.getOrderHistory)
// updated 
router.get('/account/orders/all', varifyLoginUserSession, userAccountController.getAllOrders)
router.get('/account/orders/all/ord/:id', isLogin, userAccountController.getOrderDetaillsPage)
router.get('/account/orders/all/ord/info/address', varifyLoginUserSession, userAccountController.getDeliveryInfo)
router.get('/account/orders/all/ord/info/rewards',varifyLoginUserSession,  userAccountController.getRewards)
router.get('/account/orders/all/ord/invoice/download', varifyLoginUserSession, userAccountController.downloadInvoice)
// retry payment 

router.post('/account/orders/all/ord/payment/retry', varifyLoginUserSession, userAccountController.createRetryPaymentOrder)
router.patch('/account/orders/all/ord/payment/varify', varifyLoginUserSession, userAccountController.varifyRetryPayment)

// updated

router.get('/account/orders/all/ord/info/itemes', varifyLoginUserSession, userAccountController.getOrderItems)
router.patch('/account/orders/all/ord/cancel/order', varifyLoginUserSession, userAccountController.cancelOrderByUser)
router.get('/account/orders/all/ord/items/return', isLogin, userAccountController.getReturnProductPage)
router.patch('/account/orders/all/ord/items/return', varifyLoginUserSession, userAccountController.returnSelectedProducts)

// ORDERS ROUTES START
router.get('/account/wallet', varifyLoginUserSession, userAccountController.getWallet)
router.get('/account/wallet/all', varifyLoginUserSession, userAccountController.getAllWalletTransactions)

// coupons based routes
router.get('/account/coupons', isLogin, userAccountController.getCoupons)
router.get('/account/coupons/all', varifyLoginUserSession, userAccountController.getAllUserCoupons)

// ORDER BASED ROUTES
router.get('/cart', isLogin,  userOrderController.getCartPage)
router.get('/cart/all', varifyLoginUserSession, userOrderController.getCartItems)
router.get('/cart/total', varifyLoginUserSession, userOrderController.getCartTotal)
// send products id in the body
router.post('/cart/add', varifyLoginUserSession, checkIsblocked, checkProductAvailability,  userOrderController.addItemToCart)
router.patch('/cart/increase', varifyLoginUserSession, checkIsblocked, checkProductAvailability, userOrderController.increaseCartItemQuantity)
router.patch('/cart/decrease', varifyLoginUserSession, checkIsblocked, checkProductAvailability, userOrderController.decreaseCartItemQuantity)
router.delete('/cart/remove', varifyLoginUserSession, userOrderController.deleteCartItem)
// cart count in header
router.get('/cart/count', userOrderController.getCartItemCount)


// eg for product checkout: /checkout?productId=sdfsfksdfhsdfh
// eg of cart checkout: /checkout?cart=true 
router.get('/checkout', isLogin,  userOrderController.getCheckoutPage)
router.get('/checkout/amount', varifyLoginUserSession, userOrderController.getCheckoutAmount)
router.get('/checkout/coupons', varifyLoginUserSession, userOrderController.getApplicableCoupons)
router.patch('/checkout/apply-coupon', varifyLoginUserSession, userOrderController.applyCoupon)
router.patch('/checkout/remove-coupon', varifyLoginUserSession, userOrderController.removeAppliedCoupon)
// api calls
router.patch('/checkout/address', varifyLoginUserSession, userOrderController.chooseDeliveryAddress)
// place order with cod
router.post('/checkout/confirm', varifyLoginUserSession, checkIsblocked, compareOrderItems, userOrderController.placeOrder)
// online payment
router.post('/checkout/create-order', varifyLoginUserSession, compareOrderItems, userOrderController.createRazorypayOrder)
// varify payment and place the order by online 
router.patch('/checkout/varify-payment', varifyLoginUserSession, compareOrderItems,  userOrderController.varifyPayment)

router.get('/checkout/address/new', isLogin, userOrderController.getAddAnotherAddressPage)

module.exports = router 