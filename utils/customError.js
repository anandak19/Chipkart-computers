const { STATUS_CODES } = require("./constants");


class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR
    }
}

module.exports = CustomError;