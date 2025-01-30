const express = require('express')
const { isAdminLogin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");
const { upload } = require('../utils/multer');
const { newProductValidations, updateProductValidations } = require('../middlewares/productValidation');

const router = express.Router()


router.get('/', isAdminLogin, adminController.getDashboard)
router.get('/users', isAdminLogin,  adminController.getUserManagement)
// use http response and request , and remove this isAdminLogin from non-get apis
router.post('/users/toggle-block/:id',isAdminLogin, adminController.toggleBlockUser)
router.get('/users/search',isAdminLogin, adminController.searchUser)
// user manaement end  

// product management 
router.get('/products', isAdminLogin,  adminController.getProductManagement)
router.get('/products/new',isAdminLogin, adminController.getProductForm)
router.post('/products/new', upload.array('images'), newProductValidations, adminController.addNewProduct)
router.get('/products/edit/:id', adminController.getEditProductForm)
// newProductValidations should be use here - i just removed it form debuging
router.post('/products/edit/:id', upload.array('images'), adminController.postEditProductForm)
router.post('/products/toggle-listed/:id', adminController.toggleListProduct)
//category management
// router.get('/categories', isAdminLogin, adminController.getCategoryManagement)
router.get('/categories', adminController.getCategoryManagement)
router.post('/categories/toggle-listed/:id', adminController.toggleListCategory)
router.get('/categories/edit/:id', adminController.getUpdateCategoryForm)
router.post('/categories/edit/:id', adminController.postUpdateCategoryForm)
router.get('/categories/new', adminController.getCategoryForm)
router.post('/categories/new', adminController.postCategoryForm)
// offer management 
// render the offer page 
router.get('/offers', isAdminLogin, adminController.getOfferModule)
// render the order page to the admin
router.get('/orders', isAdminLogin, adminController.getOrderManagement)
// render the sales report page 
router.get('/reports', isAdminLogin, adminController.getSalesReport)
// render the coupen management page 
router.get('/coupons', isAdminLogin, adminController.getCouponManagement)

/*
optional  we need banner management page
*/





module.exports = router