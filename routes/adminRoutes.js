const express = require('express')
const { isAdminLogin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");
const { upload } = require('../utils/multer');
const { newProductValidations, updateProductValidations } = require('../middlewares/productValidation');

const router = express.Router()
// const router = express()


router.get('/', isAdminLogin, adminController.getDashboard)
// router.get('/users', isAdminLogin, adminController.getUserManagement)
router.get('/users', adminController.getUserManagement)
router.post('/users/toggle-block/:id', adminController.toggleBlockUser)
router.get('/users/search', adminController.searchUser)
// user manaement end  

// product management 
// router.get('/products', isAdminLogin, adminController.getProductManagement)
router.get('/products', adminController.getProductManagement)
router.get('/products/new', adminController.getProductForm)
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
router.get('/offers', isAdminLogin, adminController.getOfferModule)
router.get('/orders', isAdminLogin, adminController.getOrderManagement)
router.get('/reports', isAdminLogin, adminController.getSalesReport)
router.get('/coupons', isAdminLogin, adminController.getCouponManagement)





module.exports = router