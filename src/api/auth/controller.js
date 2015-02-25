/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var uuid = require('node-uuid');
var util = require('util');
var jwt = require('jwt-simple');
var fb = require('fb');

//services
var authService = require('modules/auth');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

Controller.prototype.authenticateWithCredentials = function authenticateWithCredentials(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;

  async.waterfall([
    function authenticateUser(done) {
      authService.authenticateCredentials({
        email: email,
        password: password
      }, done);
    }
  ], function finish(err, results) {
    if (err) return next(err);

    res.status(200).json({
      token: results.token,
      expires: results.expires,
      user: results.user
    });
  });
};

Controller.prototype.authenticateWithFacebook = function authenticateWithFacebook(req, res, next) {
  var facebookAccessToken = req.body.facebookAccessToken;

  if (!facebookAccessToken) return next(new error.InvalidArgumentError('Facebook access token is required'));

  async.waterfall([
    function authenticateUser(done) {
      authService.authenticateFacebook({
        facebookAccessToken: facebookAccessToken
      }, done);
    }
  ], function finish(err, results) {
    if (err) return next(err);

    res.status(200).json({
      token: results.token,
      expires: results.expires,
      user: results.user
    });
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
