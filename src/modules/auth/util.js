/* =========================================================================
 *
 *   Dependencies
 *
 * ========================================================================= */
var async = require('async');
var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');

//modules
var error = require('modules/error');

var appConfig = require('src/config/app-config');

function AuthUtil() {}

/**
 *
 */
AuthUtil.prototype.generatePasswordHashAndSalt = function(password, next) {
  if (!password) return next(new error.InvalidArgumentError('Password is required'));

  async.waterfall([

    function generateSalt(callback) {

      var numRounds = 8; //change the numRounds to change the complexity of the hash and the time it takes to generate

      bcrypt.genSalt(numRounds, callback);
    },
    function generateHash(salt, callback) {
      bcrypt.hash(password, salt, null, callback);
    }
  ], function finish(err, hash) {
    return next(err, hash);
  });
};

/**
 *
 */
AuthUtil.prototype.comparePasswordHashes = function(options, next) {
  if (!options) return next(new error.InvalidArgumentError('options is required'));
  if (!options.hash) return next(new error.InvalidArgumentError('Hash is required'));
  if (!options.password) return next(new error.InvalidArgumentError('Password is required'));

  bcrypt.compare(options.password, options.hash, next);
};

/**
 *
 */
AuthUtil.prototype.generateAuthToken = function(options, next) {
  if (!options) return next(new error.InvalidArgumentError('options is required'));
  if (!options.user) return next(new error.InvalidArgumentError('User is required'));

  var expires = (new Date()).setDate(new Date().getDate() + 7);

  var token = jwt.encode({
    iss: options.user._id,
    exp: expires
  }, appConfig.tokenKey);

  return next(null, {
    token: token,
    expires: expires
  });
};

AuthUtil.prototype.decodeToken = function(token, next) {
  if (!token) return next(new error.InvalidArgumentError('Token is required'));

  var decodedToken;

  try {
    decodedToken = jwt.decode(token, appConfig.tokenKey);
  } catch (err) {
    return next(new error.UnauthorizedError('Error decoding access token'));
  }

  return next(null, decodedToken);
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new AuthUtil();
