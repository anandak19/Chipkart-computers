const UserSchema = require("../models/User");


const otpGenerator = async (req, res) => {
    const otp =  Math.floor( 1000 + Math.random * 9000).toString()
    const currentTime = new Date()
    const otpExpires = new Date(currentTime.getTime() + 60 * 1000);
    
    const userData = await UserSchema.findOne()

}

module.exports = {otpGenerator}