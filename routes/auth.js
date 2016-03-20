var express = require('express');
var google = require('googleapis');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var OAuth2 = google.auth.OAuth2;

  var CLIENT_ID = "<Client ID>";
  var CLIENT_SECRET = "<Client Secret>";
  var REDIRECT_URL = "<Redirect URL>";
  var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

  var scopes = [
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.user'
  ];

  var googleAuthURL = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes // If you only need one scope you can pass it as string
    // , approval_prompt: 'force'
  });

  res.render('auth', { title: 'Authentication for Google', url: googleAuthURL });
});

module.exports = router;
