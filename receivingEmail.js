const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const mimeMessage = require("mime-message");
const rp = require("request-promise");
const parseMessage = require("gmail-api-parse-message");
const token = require("./token.json");

const GMAIL_SCOPES = require("./gmailscopes.json");

// If modifying these scopes, delete token.json.
const SCOPES = [
  GMAIL_SCOPES.COMPOSE,
  GMAIL_SCOPES.SETTING_BASICS,
  GMAIL_SCOPES.LABEL,
  GMAIL_SCOPES.FULL_ACCESS,
  GMAIL_SCOPES.INSERT,
  GMAIL_SCOPES.SEND,
  GMAIL_SCOPES.READ_ONLY,
  GMAIL_SCOPES.SETTING_SHARING,
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listMessages);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, async (err, token) => {
    //Generate access token and refresh token
    // await getNewToken(oAuth2Client, callback);

    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.labels.list(
    {
      userId: "me",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log("Labels:");
        labels.forEach((label) => {
          console.log(`- ${label.name}`);
        });
      } else {
        console.log("No labels found.");
      }
    }
  );
}

async function listMessages(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  let response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 30,
  });
  // console.log(response.data.messages);

  const newestMessageId = response["data"]["messages"][26]["id"];
  rp({
    uri: `https://www.googleapis.com/gmail/v1/users/me/messages/${newestMessageId}?access_token=${token.access_token}`,
    json: true,
  }).then(function (response) {
    var parsedMessage = parseMessage(response);
    console.log(parsedMessage);
  });

}
