const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "brown8wolf@gmail.com",
    pass: "fgrk lyoa yygc dspu",
  },
});

// Sample function to send an email
const sendEmail = (name = 'user', to, subject, text, callback) => {
  const mailOptions = {
    from: "brown8wolf@gmail.com",
    to: to,
    subject: subject,
    html: `<p>Dear ${name},</p><p>Your OTP for verification is: <b>${text}</b></p><p>Regards,<br>Chipkart Computers</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return callback(error);
    } else {
      console.log("Email sent: " + info.response);
      return callback(null, info.response);
    }
  });
};

const sendPasswordReset = (name = 'user', to, subject, resetLink, callback) => {
  const mailOptions = {
    from: "brown8wolf@gmail.com",
    to: to,
    subject: subject,
    html: `<p>Dear ${name},</p><p>Click <a href="${resetLink}">here</a> to reset your password. The link will expire in 1 hour</p>Regards,<br>Chipkart Computers</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return callback(error);
    } else {
      console.log("Email sent: " + info.response);
      return callback(null, info.response);
    }
  });
};

module.exports = { sendEmail, sendPasswordReset };
