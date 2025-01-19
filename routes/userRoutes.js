const express = require('express')
const userController = require('../controllers/userController')
const { isLogin } = require('../middlewares/userAuth')


const router = express.Router()

router.get('/', userController.getHome)

// get user personal details page 
router.get('/account', isLogin, userController.getAccount)


module.exports = router