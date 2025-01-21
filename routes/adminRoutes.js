const express = require('express')
const { isAdminLogin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");

const router = express.Router()


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