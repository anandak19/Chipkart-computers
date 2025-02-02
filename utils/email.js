const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// move pass to env later for security 
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "brown8wolf@gmail.com",
    pass: "fgrk lyoa yygc dspu",
  },
});

const sendEmailToUser = (to, html, subject) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: "brown8wolf@gmail.com",
      to: to,
      subject: subject,
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email in email js", error);
        return reject(error);
      } else {
        console.log("Email send to user", info.response);
        return resolve(info.response);
      }
    });
  });
};

module.exports = { sendEmailToUser };
