/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var uuid = require('node-uuid');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var User = require('./data/model');
var Auth = require('src/modules/auth/data/model');

var authUtil = require('modules/auth/util');

/* =========================================================================
 * Constants
 * ========================================================================= */
var REGEXES = require('modules/common/constants/regexes');

var UserService = function() {
  CommonService.call(this, User);
};
util.inherits(UserService, CommonService);

/**
 * @param {object} options
 * @param {string} email - user's email address
 * @param {string} password
 * @param {function} next - callback
 */
UserService.prototype.createUsingCredentials = function(options, next) {
  if (!options.email) return next(new errors.InvalidArgumentError('Email is required'));
  if (!options.password) return next(new errors.InvalidArgumentError('Password is required'));

  var _this = this;

  options.email = options.email.toLowerCase();

  if (!REGEXES.email.test(options.email)) return next(new errors.InvalidArgumentError(options.email + ' is not a valid email address'));
  if (options.password.length < 6) return next(new errors.InvalidArgumentError('Password must be at least 6 characters'));

  async.waterfall([
    function getUserByEmail(done) {
      _this.getByEmail({
        email: options.email
      }, done);
    },
    function generatePasswordHash(foundUser, done) {
      if (foundUser) return done(new errors.InvalidArgumentError('A user with the email ' + options.email + ' already exists'));

      authUtil.generatePasswordHashAndSalt(options.password, done);
    },
    function createNewUser(hash, done) {
      var user = new User();
      user.email = options.email;
      user.active = true;

      user.save(function(err, newUser) {
        done(err, newUser, hash);
      });
    },
    function createNewAuth(user, hash, done) {
      var auth = new Auth();
      auth.user = user._id;
      auth.hash = hash;
      auth.save(function(err, newAuth) {
        done(err, user);
      });
    }
  ], function finish(err, newUser) {
    return next(err, newUser);
  });
};

/**
 * @param {object} options
 * @param {string} email - user's email address
 * @param {string} facebookid - user's facebook id
 * @param {string} facebookUsername - facebook username
 * @param {function} next - callback
 */
UserService.prototype.createUsingFacebook = function(options, next) {
  if (!options.email) return next(new errors.InvalidArgumentError('Email is required'));
  if (!options.facebookId) return next(new errors.InvalidArgumentError('Facebook Id is required'));

  var _this = this;

  options.email = options.email.toLowerCase();

  if (!REGEXES.email.test(options.email)) return next(new errors.InvalidArgumentError(options.email + ' is not a valid email address'));

  async.waterfall([
    function getUserByEmail(done) {
      _this.getByEmail({
        email: options.email
      }, done);
    },
    function createNewUser(foundUser, done) {
      if (foundUser) return callback(new errors.InvalidArgumentError('A user with the email ' + options.email + ' already exists'));

      var user = new User();
      user.email = options.email.toLowerCase();
      user.active = true;
      user.created = Date.now();
      user.auth.facebook.id = options.facebookId;
      user.auth.facebook.username = options.facebookUsername;

      user.save(callback);
    }
  ], function finish(err, newUser) {
    return next(err, newUser);
  });
};

/**
 * @param {object} options
 * @param {object} findOptions - hash of mongoose query params
 * @param {array} [populate] - array of keys to populate
 * @param {function} next - callback
 */
UserService.prototype.getAll = function(options, next) {
  var query = User.find({});

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {string} userId - user's id
 * @param {array} [populate] - array of keys to populate
 * @param {function} next - callback
 */
UserService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var query = User.findOne({
    _id: options.userId
  });

  query.exec(function(err, user) {
    if (err) return next(err);
    if (!user) return next(new errors.ObjectNotFoundError('User not found'));

    next(null, user);
  });
};

/**
 * @param {object} options
 * @param {string} email - user's email
 * @param {string} [populate] - array of keys to populate
 * @param {function} next - callback
 */
UserService.prototype.getByEmail = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.email) return next(new errors.InvalidArgumentError('Email is required'));

  var query = User.findOne({
    email: options.email.toLowerCase()
  });

  query.exec(next);
};

/**
 * @param {object} options
 * @param {string} facebookId
 * @param {function} next - callback
 */
UserService.prototype.getByFacebookId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.facebookId) return next(new errors.InvalidArgumentError('Facebook Id is required'));

  var query = User.findOne({
    'facebook.id': options.facebookId
  });

  query.exec(next);
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {function} next - callback
 */
UserService.prototype.delete = function(options, next) {
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  User.findOneAndRemove({
    _id: options.userId
  }, next);
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {object} updates
 * @param {function} next - callback
 * @param {bool} allowAll
 */
UserService.prototype.update = function(options, next, allowAll) {
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.updates) return next(new errors.InvalidArgumentError('Updates is required'));

  var self = this;

  async.waterfall([

    function findUserById(callback) {
      self.getById({
        userId: options.userId
      }, callback);
    },
    function updateUser(user, callback) {
      if (!user) return callback(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

      user.update(options.updates, callback, allowAll);
    }
  ], function finish(err, results) {
    return next(err, results);
  });
};

// public api ===============================================================================
module.exports = new UserService();
