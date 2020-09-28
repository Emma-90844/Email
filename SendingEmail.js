const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const credentials = require("./credentials.json").web;
const token = require("./token.json")


const { client_secret, client_id, redirect_uris } = credentials;
const oauth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

oauth2Client.setCredentials({
  refresh_token: token.refresh_token,
});

// 1. Make request
// 2. Check if the status code is 401
// 3. Generate a new access token and replace the old one

const accessToken = oauth2Client.getAccessToken();

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "onencanemma9@gmail.com",
    clientId: client_id,
    clientSecret: client_secret,
    refreshToken: token.refresh_token,
    accessToken: accessToken,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const mailOptions = {
  from: "onencanemma9@gmail.com",
  to: ["enabojohn@gmail.com"],
  subject: "Assessment Report",
  generateTextFromHTML: true,
  html: "This is my assessment report for 2020 xxxxxxxx",
};


smtpTransport.sendMail(mailOptions, (error, response) => {
  error ? console.log(error) : console.log(response);
  smtpTransport.close();
});
