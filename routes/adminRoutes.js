const express = require('express')

const router = express.Router()


router.get('/dashbord', (req, res) => {
    res.render('admin/dashbord')
})



module.exports = router