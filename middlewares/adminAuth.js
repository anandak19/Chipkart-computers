const isAdminLoginSubmitted = (req, res, next) => {
    if (req.session.isLogin) {
        res.render('admin/dashbord')
    }else{
        return next()
    }
}

const isAdminLogin = (req, res, next) => {
    const isAdminLogin = req?.session?.isLogin || false;
    console.log(isAdminLogin)
    if (!isAdminLogin) {
        return res.redirect('/admin/login');
    }
    return next()
}

module.exports = {isAdminLoginSubmitted, isAdminLogin}