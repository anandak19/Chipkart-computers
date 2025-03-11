const express = require('express')
const { isAdminLogin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");
const { upload } = require('../utils/multer');
const { newProductValidations, updateProductValidations } = require('../middlewares/productValidation');
const { validateCouponDetails } = require('../middlewares/coupon');
const { validateOffer } = require('../middlewares/offerValidators');

const router = express.Router()


router.get('/', isAdminLogin, adminController.getDashboard)
router.get('/chart-data', adminController.getChartData)
router.get('/top-selling', adminController.getTopSellingData)
// user management start
// -- isAdminLogin will come here
router.get('/users', isAdminLogin, adminController.getUserManagementPage)
router.get('/users/all', adminController.getUsers)
// use http response and request , and remove this isAdminLogin from non-get apis
router.patch('/users/toggle-block/:id', adminController.toggleBlockUser)
router.get('/users/search', adminController.searchUser)
// user manaement end  

// product management 
router.get('/products', isAdminLogin,  adminController.getProductManagement)
router.get('/products/all',  adminController.getAllProducts)
router.get('/products/new', adminController.getProductForm)
router.post('/products/new', upload.array('images'), newProductValidations, adminController.addNewProduct)
router.get('/products/edit/:id', adminController.getEditProductForm)
// update product validation middleware should be here 
router.post('/products/edit/:id', upload.array('images'), adminController.postEditProductForm)
router.post('/products/toggle-listed/:id', adminController.toggleListProduct)

//category management
router.get('/categories', isAdminLogin, adminController.getCategoryManagement)
router.get('/categories/all', adminController.getCategories)
router.post('/categories/toggle-listed/:id', adminController.toggleListCategory)
router.get('/categories/edit/:id', adminController.getUpdateCategoryForm)
router.post('/categories/edit', upload.single('image'), adminController.postUpdateCategoryForm)
router.get('/categories/new', isAdminLogin,  adminController.getCategoryForm) // isAdminLogin,
router.post('/categories/new', upload.single('image'),  adminController.postCategoryForm)

// offer management 
// render the offer page
router.get('/offers', isAdminLogin, adminController.getOfferModule)
router.get('/offers/new', isAdminLogin, adminController.getNewOfferForm)
router.post('/offers/new', validateOffer, adminController.saveNewOffer)
// add clint side for all of this ----
router.get('/offers/all', adminController.getAllOffers)
router.get('/offers/edit/:id',isAdminLogin, adminController.getEditOfferForm)
router.get('/offers/edit/offer/details', adminController.getSingleOfferDetails)
router.post('/offers/edit/offer/details', adminController.saveUpdatedOffer)
router.patch('/offers/unlist/:id', adminController.tooggleOfferStatus)
// apply offer for product and category 
router.get('/offers/apply/:id', adminController.getOfferApplyPage)
// get the offer of selected type -product/category offer
router.get('/offers/apply/available/all', adminController.getOfferOfType)
router.patch('/offers/apply/available/all/:id', adminController.applyNewOffer)
router.patch('/offers/apply/available/remove-offer', adminController.removeExistingOffer)


router.get('/categories/available', adminController.getAvailableCategories)

router.get('/categories/available', adminController.getAvailableCategories)

// render the order page to the admin
router.get('/orders',isAdminLogin, adminController.getOrderManagement)
router.get('/orders/all', adminController.getAllOrders)
// of single order
router.get('/orders/info', adminController.getUserDataAndDeliveryInfo)
router.get('/orders/items', adminController.getOrderItems)
router.post('/orders/cancel/order', adminController.cancelOrderByAdmin)
router.patch('/orders/return/approve/:id', adminController.approveReturnItem)
router.patch('/orders/return/reject/:id', adminController.rejectReturnItemRefund)

// router.get('/orders/all/:orderId', adminController.renderOrderDetailsPage)
router.get('/orders/all/:orderId', isAdminLogin, adminController.renderOrderDetailsPage)
router.post('/orders/update-status', adminController.updateOrderStatus)

// REPORTS START
// render the sales report page 
router.get('/reports', isAdminLogin, adminController.getSalesReport)
router.get('/reports/data', adminController.fetchSalesReportData)
router.get('/reports/orders', adminController.fetchAllOrders)
router.get('/reports/data/dowload/pdf', adminController.downloadSalesReportPdf)
router.get('/reports/data/dowload/excel', adminController.downloadSalesReportExcel)
// REPORTS END

// render the coupen management page 
router.get('/coupons', isAdminLogin, adminController.getCouponManagement)

router.get('/coupons/all', adminController.getAllCoupons)
router.get('/coupons/new', isAdminLogin, adminController.getNewCouponForm)
router.post('/coupons/new', validateCouponDetails, adminController.saveNewCoupon)
router.get('/coupons/edit/:id', adminController.getEditCouponForm)
router.get('/coupons/details', adminController.getEditCouponDetails)
router.patch('/coupons/details', validateCouponDetails, adminController.saveUpdatedCoupon)
router.patch('/coupons/unlist/:id', adminController.toogleCouponStatus)

/*
optional  we need banner management page
*/





module.exports = router