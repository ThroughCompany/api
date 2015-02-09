/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');
var jwt = require('jwt-simple');
var fb = require('fb');

//modules
var errors = require('modules/error');

//services
var userService = require('modules/user');

//models
var Auth = require('./data/model');

var authUtil = require('./util');

function AuthService() {}

/**
 * @description Authenticate a user's credentials
 * @param {Object} options
 * @param {String} options.email
 * @param {String} options.password
 * @param {Function} next - callback
 */
AuthService.prototype.authenticateCredentials = function authenticateCredentials(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.email) return next(new errors.InvalidArgumentError('Email is required'));
  if (!options.password) return next(new errors.InvalidArgumentError('Password is required'));

  var _this = this;
  var _user = null;
  var _auth = null;

  async.waterfall([
    function findUserByEmail_step(done) {
      userService.getByEmail({
        email: options.email
      }, done);
    },
    function findUserAuthByUserId_step(user, done) {
      if (!user) return done(new errors.UnauthorizedError('Invalid email or password'));
      _user = user;

      _this.getAuthByUserId({
        userId: user._id
      }, done);
    },
    function verifyPasswordHash_step(auth, done) {
      if (!_user || !auth) return done(new errors.UnauthorizedError('Invalid email or password'));
      _auth = auth;

      authUtil.comparePasswordHashes({
        hash: _auth.hash,
        password: options.password
      }, function(err, hashResult) {
        if (err || hashResult === false) return done(new errors.UnauthorizedError('Invalid email or password'));
        else return done(null);
      });
    },
    function generateAuthToken_step(done) {
      authUtil.generateAuthToken({
        user: _user
      }, done);
    }
  ], function finish(err, results) {
    if (err) return next(err);

    next(null, {
      token: results.token,
      expires: results.expires,
      user: _user
    });
  }, next);
};

/**
 * @description Get a user's auth info by their id
 * @param {Object} options
 * @param {String} options.userId
 * @param {Function} next - callback
 */
AuthService.prototype.getAuthByUserId = function getAuthByUserId(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('options.userId is required'));

  Auth.findOne({
    user: options.userId
  }, next);
};

/**
 * @description Authenticate a user's API token
 * @param {Object} options
 * @param {String} options.userId
 * @param {Function} next - callback
 */
AuthService.prototype.authenticateToken = function authenticateToken(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.token) return next(new errors.InvalidArgumentError('Token is required'));

  var _this = this;

  async.waterfall([
    function decodeToken(done) {
      authUtil.decodeToken(options.token, done);
    },
    function findUserById(decodedToken, done) {
      if (decodedToken.exp <= Date.now()) return done(new errors.UnauthorizedError('Access token has expired'));

      var userId = decodedToken.iss;

      _this.getUserClaims({
        userId: userId
      }, done);
    }
  ], function finish(err, claims) {
    if (err) return next(err);

    return next(null, claims);
  });
};

/**
 * @description Authenticate using a Facebook access token
 * @param {Object} options
 * @param {String} options.facebookAccessToken
 * @param {Function} next - callback
 */
AuthService.prototype.authenticateFacebook = function authenticateFacebook(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.facebookAccessToken) return next(new errors.InvalidArgumentError('Facebook Access Token is required'));

  var _this = this;

  async.waterfall([
    function getFacebookData(done) {
      fb.setAccessToken(options.facebookAccessToken);
      fb.api('me', done);
    },
    function getUserByFacebookToken(facebookData, done) {
      if (!facebookData || facebookData.error) return done(new errors.InternalServiceError('There was a problem getting your Facebook data'));

      userService.getByFacebookId({
        facebookId: facebookData.id
      }, function(error, user) {
        return callback(error, user, facebookData);
      });
    },
    function connectOrRegisterWithFacebook(user, facebookData, callback) {
      var facebookEmail = facebookData.email;

      if (user) {
        return callback(null, user);
      } else {
        if (facebookEmail) {
          userEntityManager.getByEmail({
            email: facebookEmail
          }, function(error, user) {
            if (error) {
              return callback(error);
            }
            if (!user) {
              return userEntityManager.createUsingFacebook({
                email: facebookData.email,
                facebookId: facebookData.id,
                facebookUsername: facebookData.username
              }, callback);
            } else {
              userEntityManager.update({
                userId: user._id,
                updates: {
                  auth: {
                    facebook: {
                      id: facebookData.id,
                      username: facebookData.username
                    }
                  }
                }
              }, callback, true);
            }
          });
        } else return userEntityManager.createUsingFacebook({
          email: facebookData.email,
          facebookId: facebookData.id,
          facebookUsername: facebookData.username
        }, callback);
      }
    }
  ], function finish(err, user) {
    return next(err, user);
  });
};

/**
 * @description Get a user's authorization claims
 *
 */
AuthService.prototype.getUserClaims = function getUserClaims(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  async.waterfall([
    function getUserById_step(done) {
      userService.getById({
        userId: options.userId
      }, done);
    },
    function getUserClaims_step(user, done) {
      var userClaims = {
        userId: user._id,
        email: user.email,
        projectIds: []
      };

      if (user.projectUsers) {
        user.projectUsers.forEach(function(projectUser) {

          userClaims.projectIds.push(projectUser.project);

          if (projectUser.permissions) {
            projectUser.permissions.forEach(function(permission) {
              userClaims[permission.name + '-' + projectUser.project] = true;
            });
          }
        });
      }

      done(null, userClaims);
    }
  ], next);
};

/* =========================================================================
 *
 *   Exports
 *
 * ========================================================================= */
module.exports = new AuthService();
