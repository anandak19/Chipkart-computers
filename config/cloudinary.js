const cloudinary = require("cloudinary").v2

cloudinary.config({
    cloud_name: "dnnus5gbl",
    api_key: "398881779339184",
    api_secret: "tYc74y_M_qfvJ2WB6_bKb0X4eFg",
})

module.exports = cloudinary;