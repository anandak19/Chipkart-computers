const UserSchema = require('../models/User')


const isAdminLoginSubmitted = (req, res, next) => {
    if (req.session.isAdminLogin) {
        res.render('admin/dashbord')
    }else{
        return next()
    }
}

const isAdminLogin = async(req, res, next) => {
    const isAdminLogin = req?.session?.isAdminLogin || false;
    const adminId = req?.session?.adminId || false;
    console.log(isAdminLogin)
    if (!isAdminLogin || !adminId) {
        return res.redirect('/admin/login');
    }

    const admin = await UserSchema.findById(adminId)
    if (!admin.isAdmin) {
        console.log("This person is not admin")
        return res.redirect('/admin/login')
    }

    return next()
}

module.exports = {isAdminLoginSubmitted, isAdminLogin}