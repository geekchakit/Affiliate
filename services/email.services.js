
const nodemailer = require('nodemailer');
const {EMAIL_FORM , PASSWORD_FORM , EMAIL_SERVICE} = require('../keys/development.keys')


exports.sendMail = (email , text) => {

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({

  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_FORM,
    pass: PASSWORD_FORM,
  },
});

const retry = require('retry');

  const operation = retry.operation({
    retries: 3, // Number of retry attempts
    factor: 2, 
    minTimeout: 1000, 
    maxTimeout: 60000, 
    randomize: true, 
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const mailOptions = {
          from: {
            name:'AFFILIATE MARKETING Services',
            address:EMAIL_FORM
          },
          to: email,
          subject: "AFFILIATE MARKETING Services",
          text: text,
        }
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        resolve(info);
      } catch (error) {
        console.error(`Error sending email (attempt ${currentAttempt}):`, error);

        if (operation.retry(error)) {
          console.log(`Retrying after ${operation._timeouts[operation._attempts - 1]} ms`);
        } else {
          reject(error);
        }
      }
    });
  });
}

exports.sendMailForCampaign = (email, text) => {
  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({

    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_FORM,
      pass: PASSWORD_FORM,
    },
  });

  const retry = require("retry");

  const operation = retry.operation({
    retries: 3, // Number of retry attempts
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 60000,
    randomize: true,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const mailOptions = {
          from: {
            name: "AFFILIATE MARKETING Services",
            address: EMAIL_FORM,
          },
          to: email,
          subject: "AFFILIATE MARKETING Services",
          html: text,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        resolve(info);
      } catch (error) {
        console.error(
          `Error sending email (attempt ${currentAttempt}):`,
          error
        );

        if (operation.retry(error)) {
          console.log(
            `Retrying after ${operation._timeouts[operation._attempts - 1]} ms`
          );
        } else {
          reject(error);
        }
      }
    });
  });
};