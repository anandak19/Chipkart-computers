const express = require('express')
const { isAdminLogin, isAdmin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");
const { upload } = require('../utils/multer');
const { newProductValidations, updateProductValidations } = require('../middlewares/productValidation');
const { validateCouponDetails } = require('../middlewares/coupon');
const { validateOffer } = require('../middlewares/offerValidators');

const router = express.Router()

// TO DO: TEST ALL ROUTE SINCE ALL ROUTE ARE REPROTECTED 

router.get('/', isAdminLogin, adminController.getDashboard)
router.get('/chart-data', isAdmin, adminController.getChartData)
router.get('/top-selling', isAdmin, adminController.getTopSellingData)
// user management start
// -- isAdminLogin will come here
router.get('/users', isAdminLogin, adminController.getUserManagementPage)
router.get('/users/all', isAdmin, adminController.getUsers)
// use http response and request , and remove this isAdminLogin from non-get apis
router.patch('/users/toggle-block/:id', isAdmin, adminController.toggleBlockUser)
router.get('/users/search', isAdmin, adminController.searchUser)
// user manaement end  

// product management 
router.get('/products', isAdminLogin,  adminController.getProductManagement)
router.get('/products/all', isAdmin,  adminController.getAllProducts)
router.get('/products/new', isAdminLogin, adminController.getProductForm)
router.post('/products/new', isAdmin, upload.array('images'), newProductValidations, adminController.addNewProduct)
router.get('/products/edit/:id', isAdminLogin, adminController.getEditProductForm)
// update product validation middleware should be here 
router.patch('/products/edit/:id', isAdmin, upload.array('images'), adminController.postEditProductForm)
router.patch('/products/toggle-listed/:id', isAdmin, adminController.toggleListProduct)

//category management
router.get('/categories', isAdminLogin, adminController.getCategoryManagement)
router.get('/categories/all', isAdmin, adminController.getCategories)
router.get('/categories/new', isAdminLogin,  adminController.getCategoryForm)
router.post('/categories/new', isAdmin, upload.single('image'),  adminController.postCategoryForm)
router.patch('/categories/toggle-listed/:id', isAdmin, adminController.toggleListCategory)
router.get('/categories/edit/:id', isAdminLogin, adminController.getUpdateCategoryForm)
router.patch('/categories/edit', isAdmin, upload.single('image'), adminController.postUpdateCategoryForm)
// return listed categories only 
router.get('/categories/available', isAdmin, adminController.getAvailableCategories)

// offer management 
// render the offer page
router.get('/offers', isAdminLogin, adminController.getOfferModule)
router.get('/offers/new', isAdminLogin, adminController.getNewOfferForm)
router.post('/offers/new', isAdmin, validateOffer, adminController.saveNewOffer)
// add clint side for all of this ----
router.get('/offers/all', isAdmin, adminController.getAllOffers)
router.get('/offers/edit/:id',isAdminLogin, adminController.getEditOfferForm)
router.get('/offers/edit/offer/details', isAdmin, adminController.getSingleOfferDetails)
router.patch('/offers/edit/offer/details', isAdmin, adminController.saveUpdatedOffer)
router.patch('/offers/unlist/:id', isAdmin, adminController.tooggleOfferStatus)
router.get('/offers/apply/:id', isAdminLogin, adminController.getOfferApplyPage)
// get the offer of selected type -product/category offer
router.get('/offers/apply/available/all', isAdmin, adminController.getOfferOfType)
router.patch('/offers/apply/available/all/:id', isAdmin, adminController.applyNewOffer)
router.patch('/offers/apply/available/remove-offer', isAdmin, adminController.removeExistingOffer)


// render the order page to the admin
router.get('/orders',isAdminLogin, adminController.getOrderManagement)
router.get('/orders/all', isAdmin, adminController.getAllOrders)
// of single order
router.get('/orders/info', isAdmin, adminController.getUserDataAndDeliveryInfo)
router.get('/orders/items', isAdmin, adminController.getOrderItems)
router.patch('/orders/cancel/order', isAdmin, adminController.cancelOrderByAdmin)
router.patch('/orders/return/approve/:id', isAdmin, adminController.approveReturnItem)
router.patch('/orders/return/reject/:id', isAdmin, adminController.rejectReturnItemRefund)

router.get('/orders/all/:orderId', isAdminLogin, adminController.renderOrderDetailsPage)
router.patch('/orders/update-status', isAdmin, adminController.updateOrderStatus)

// REPORTS START
// render the sales report page 
router.get('/reports', isAdminLogin, adminController.getSalesReport)
router.get('/reports/data', isAdmin, adminController.fetchSalesReportData)
router.get('/reports/orders', isAdmin, adminController.fetchAllOrders)
router.get('/reports/data/dowload/pdf', isAdmin, adminController.downloadSalesReportPdf)
router.get('/reports/data/dowload/excel', isAdmin, adminController.downloadSalesReportExcel)
// REPORTS END

// render the coupen management page 
router.get('/coupons', isAdminLogin, adminController.getCouponManagement)

router.get('/coupons/all', isAdmin, adminController.getAllCoupons)
router.get('/coupons/new', isAdminLogin, adminController.getNewCouponForm)
router.post('/coupons/new', isAdmin, validateCouponDetails, adminController.saveNewCoupon)
router.get('/coupons/edit/:id', isAdminLogin, adminController.getEditCouponForm)
router.get('/coupons/details', isAdmin, adminController.getEditCouponDetails)
router.patch('/coupons/details', isAdmin, validateCouponDetails, adminController.saveUpdatedCoupon)
router.patch('/coupons/unlist/:id', isAdmin, adminController.toogleCouponStatus)

module.exports = router