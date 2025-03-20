const { STATUS_CODES } = require("../utils/constants");

const errorHandler = (err, _req, res, _next) => {
  console.log(err)
  let statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  res.status(statusCode).json({ success: false, error: message });
};

module.exports = {errorHandler}