var fs = require('fs'),
async = require('async'),
express = require('express'),
google = require('googleapis'),
admin = google.admin('directory_v1');

var router = express.Router();
var OAuth2Client = google.auth.OAuth2;

router.post('/', function(req, res, next) {
  res.render('auth', { title: 'Welcome to Google Token page - it\'s post' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  var CLIENT_ID = "<Client ID>";
  var CLIENT_SECRET = "<Client Secret>";
  var REDIRECT_URL = "<Redirect URL>";

  // console.log("code is: " + req.query.code);

  var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
  var scopes = [
  'https://www.googleapis.com/auth/admin.directory.group',
  'https://www.googleapis.com/auth/admin.directory.user'
  ];
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: scopes // can be a space-delimited string or an array of scopes
  });

  oauth2Client.getToken(req.query.code, function(err, tokens) {
    // set tokens to the client
    // TODO: tokens should be set by OAuth2 client.
    oauth2Client.setCredentials(tokens);

    admin.groups.list({ domain: '<full domain name. e.g. google.com>', auth: oauth2Client }, function(err, response) {
      if (err) {
        console.log('error while fetching groups info : ' + err);
      } else {
        var groupsObj = response;

        var membersHeader = "groupId,groupName,members";
        fs.appendFile("members.csv", membersHeader + "\n", function (err) {
          if(err) {
            console.log(err);
          } else {
            console.log("members header saved");

            async.eachSeries(groupsObj.groups, function(group, callback) {
              console.log("group members count: " + group.directMembersCount);
              async.waterfall([
                function getMemberInfo(saveCallback) {
                  admin.members.list({ groupKey: group.id, auth: oauth2Client}, function(memberError, memberResponse) {
                    if (memberError) {
                      saveCallback(memberError)
                    } else {
                      saveCallback(null, memberResponse, group);
                    }
                  });
                },
                function saveMembersInfo(membersObj, group, saveCallback) {
                  var groupObj = {};
                  groupObj.id = group.id;
                  groupObj.name = group.name;

                  var membersEmails = '';
                  if (membersObj.members) {
                    for(var i=0; i< membersObj.members.length; i++) {
                      membersEmails += membersObj.members[i].email +";";
                    }
                  }
                  groupObj.members = membersEmails;
                  membersEmails = '';

                  var memberData = groupObj.id + "," + groupObj.name + "," + groupObj.members;
                  fs.appendFile("members.csv", memberData + "\n", function (err) {
                    if(err) {
                      console.log(err);

                      saveCallback(err);
                    } else {
                      console.log("member data saved for : "+ groupObj.name);

                      saveCallback(null);
                    }
                  });
                }
                ],function asyncComplete(err) {
                  if (err) {
                    console.warn('Error fetching member info.', err);
                  }

                  console.log('async complete');
                  callback(null);
                });
            }, function(err){
              if (err) {
                console.log('error in loop : '+ err);
              }

              console.log('loop completed');
            });
          }
        });
      }
    });

    res.render('token', { title: 'Welcome to Google Token page - it\'s get' });
  });
});

module.exports = router;
