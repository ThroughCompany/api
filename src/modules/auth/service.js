/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');
var jwt = require('jwt-simple');

//modules
var errors = require('modules/error');
var logger = require('modules/logger');

//services
var userService = require('modules/user');
var adminService = require('modules/admin');
var projectService = require('modules/project');
var permissionService = require('modules/permission');

//lib
var facebookApi = require('lib/facebook-api');

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
        userId: _user._id
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
      facebookApi.getUserByToken({
        facebookAccessToken: options.facebookAccessToken
      }, done);
    },
    function getUserByFacebookToken(facebookData, done) {
      if (!facebookData || facebookData.error) return done(new errors.InternalServiceError('There was a problem getting your Facebook data'));

      userService.getByFacebookId({
        facebookId: facebookData.id
      }, function(error, user) {
        return done(error, user, facebookData);
      });
    },
    function connectOrRegisterWithFacebook(user, facebookData, done) {
      var facebookEmail = facebookData.email;

      if (user) {
        return done(null, user);
      } else if (!facebookEmail) {
        return done(new errors.InternalServiceError('There was a problem getting your Facebook data'));
      } else {
        userService.getByEmail({
          email: facebookEmail
        }, function(error, user) {
          if (error) {
            return done(error);
          }
          if (!user) {
            return userService.createUsingFacebook({
              email: facebookData.email,
              facebookId: facebookData.id,
              facebookUsername: facebookData.username
            }, done);
          } else {
            userService.update({
              userId: user._id,
              updates: {
                facebook: {
                  id: facebookData.id,
                  username: facebookData.username
                }
              }
            }, done, true);
          }
        });
      }
    },
    function generateAuthToken_step(user, done) {
      _user = user;

      authUtil.generateAuthToken({
        userId: _user._id
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
 * @description Get a user's authorization claims
 *
 */
AuthService.prototype.getUserClaims = function getUserClaims(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  async.auto({
    user: function getUserById_step(done) {
      userService.getById({
        userId: options.userId
      }, done);
    },
    admin: function getAdminByUserId_step(done) {
      adminService.getByUserId({
        userId: options.userId
      }, done);
    },
    projectUsers: function getProjectUsers_step(done) {
      projectService.getProjectUsersByUserId({
        userId: options.userId
      }, done);
    },
    permissions: ['projectUsers', function getPermissions_step(done, results) {
      var projectUsers = results.projectUsers;

      var projectUserPermissionIds = _.pluck(projectUsers, 'permissions');
      var permissionIds = [];

      _.each(projectUserPermissionIds, function(ids) {
        permissionIds = permissionIds.concat(ids);
      });

      permissionIds = _.uniq(permissionIds);

      permissionService.getByIds({
        ids: permissionIds
      }, done);
    }]
  }, function(err, results) {
    if (err) return next(err);

    var user = results.user;
    var admin = results.admin;
    var projectUsers = results.projectUsers;
    var permissions = results.permissions;

    var userClaims = {
      userId: user._id,
      email: user.email,
      admin: admin ? true : false,
      projectIds: [],
      projectPermissions: {}
    };

    if (projectUsers && projectUsers.length) {
      projectUsers.forEach(function(projectUser) {
        userClaims.projectIds.push(projectUser.project);

        var projectPermissions = [];

        if (projectUser.permissions) {
          projectUser.permissions.forEach(function(permission) {
            var foundPermission = _.find(permissions, function(p) {
              return p._id === permission;
            });

            if (foundPermission) {
              projectPermissions.push({
                name: foundPermission.name
              });
            }
          });
        }

        userClaims.projectPermissions[projectUser.project] = projectPermissions;
      });
    }

    next(null, userClaims);
  });
};

/* =========================================================================
 *
 *   Exports
 *
 * ========================================================================= */
module.exports = new AuthService();
