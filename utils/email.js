const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
require('dotenv').config()

// move pass to env later for security 
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
}); 

const sendEmailToUser = (to, html, subject) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      } else {
        return resolve(info.response);
      }
    });
  });
};

module.exports = { sendEmailToUser };
