const express = require('express')
const { isAdminLogin } = require('../middlewares/adminAuth')
const adminController = require("../controllers/adminController");

const router = express.Router()


router.get('/', isAdminLogin, adminController.getDashboard)
// router.get('/users', isAdminLogin, adminController.getUserManagement)
router.get('/users', adminController.getUserManagement)
router.get('/products', isAdminLogin, adminController.getProductManagement)
router.get('/categories', isAdminLogin, adminController.getCategoryManagement)
router.get('/offers', isAdminLogin, adminController.getOfferModule)
router.get('/orders', isAdminLogin, adminController.getOrderManagement)
router.get('/reports', isAdminLogin, adminController.getSalesReport)
router.get('/coupons', isAdminLogin, adminController.getCouponManagement)





module.exports = router