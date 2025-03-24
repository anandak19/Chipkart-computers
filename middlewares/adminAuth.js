const UserSchema = require("../models/User");
const { STATUS_CODES } = require("../utils/constants");
const CustomError = require("../utils/customError");

const isAdminLoginSubmitted = (req, res, next) => {
  if (req.session.isAdminLogin) {
    res.render("admin/dashbord");
  } else {
    return next();
  }
};

const isAdminLogin = async (req, res, next) => {
  const isAdminLogin = req?.session?.isAdminLogin || false;
  const adminId = req?.session?.adminId || false;
  if (!isAdminLogin || !adminId) {
    return res.redirect("/admin/login");
  }

  const admin = await UserSchema.findById(adminId);
  if (!admin.isAdmin) {
    console.log("This person is not admin");
    return res.redirect("/admin/login");
  }

  return next();
};

const isAdmin = async (req, res, next) => {
  try {
    const isAdminLogin = req?.session?.isAdminLogin || false;
    const adminId = req?.session?.adminId || false;
    console.log(isAdminLogin)

    if (!isAdminLogin || !adminId) {
      throw new CustomError("Please login and try again.", STATUS_CODES.BAD_REQUEST);
    }
    const admin = await UserSchema.findById(adminId);
    if (!admin.isAdmin) {
      throw new CustomError(
        "Access Denied! You are not allowed to perform this action.",
        STATUS_CODES.UNAUTHORIZED
      );
    }

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = { isAdminLoginSubmitted, isAdminLogin, isAdmin };
