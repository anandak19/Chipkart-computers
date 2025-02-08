const express = require('express')
const { isAdminLogin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");
const { upload } = require('../utils/multer');
const { newProductValidations, updateProductValidations } = require('../middlewares/productValidation');

const router = express.Router()


router.get('/', isAdminLogin, adminController.getDashboard)
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
router.get('/products/new', adminController.getProductForm) 
router.post('/products/new', upload.array('images'), newProductValidations, adminController.addNewProduct)
router.get('/products/edit/:id', adminController.getEditProductForm)
router.post('/products/edit/:id', upload.array('images'), adminController.postEditProductForm)
router.post('/products/toggle-listed/:id', adminController.toggleListProduct)
//category management
router.get('/categories', isAdminLogin, adminController.getCategoryManagement)
router.get('/categories/all', adminController.getCategories)
router.post('/categories/toggle-listed/:id', adminController.toggleListCategory)
router.get('/categories/edit/:id', adminController.getUpdateCategoryForm)
router.post('/categories/edit/:id', adminController.postUpdateCategoryForm)
router.get('/categories/new', isAdminLogin, adminController.getCategoryForm)
router.post('/categories/new', adminController.postCategoryForm)
// offer management 
// render the offer page 
router.get('/offers', isAdminLogin, adminController.getOfferModule)
// render the order page to the admin
router.get('/orders',isAdminLogin, adminController.getOrderManagement)
router.get('/orders/all', adminController.getAllOrders)
router.get('/orders/info', adminController.getUserDataAndDeliveryInfo)
router.get('/orders/items', adminController.getOrderItems)

// router.get('/orders/all/:orderId', adminController.renderOrderDetailsPage)
router.get('/orders/all/:orderId',isAdminLogin, adminController.renderOrderDetailsPage)
router.post('/orders/update-status', adminController.updateOrderStatus)

// render the sales report page 
router.get('/reports', isAdminLogin, adminController.getSalesReport)
// render the coupen management page 
router.get('/coupons', isAdminLogin, adminController.getCouponManagement)

/*
optional  we need banner management page
*/





module.exports = router