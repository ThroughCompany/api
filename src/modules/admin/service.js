/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

//modules
var errors = require('modules/error');

//services
var userService = require('modules/user');

//models
var Admin = require('./data/model');

function AdminService() {}

/**
 * @description Get an admin by their user id
 * @param {Object} options
 * @param {String} options.userId
 * @param {Function} next - callback
 */
AdminService.prototype.getByUserId = function getByUserId(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;
  var _user;

  async.waterfall([
    function findUserById_step(done) {
      userService.getById({
        userId: options.userId
      }, done);
    },
    function findUserAuthByUserId_step(user, done) {
      if (!user) return done(new errors.UnauthorizedError('User not found'));
      _user = user;

      var query = Admin.findOne({
        user: options.userId
      });

      query.exec(done);
    }
  ], next);
};

/**
 * @description Create a new admin
 * @param {Object} options
 * @param {String} options.userId
 * @param {Function} next - callback
 */
AdminService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;
  var _user;

  async.waterfall([
    function findUserById_step(done) {
      userService.getById({
        userId: options.userId
      }, done);
    },
    function findUserAuthByUserId_step(user, done) {
      if (!user) return done(new errors.UnauthorizedError('User not found'));
      _user = user;

      var admin = new Admin();
      admin.user = options.userId;

      admin.save(done);
    }
  ], next);
};

/* =========================================================================
 *
 *   Exports
 *
 * ========================================================================= */
module.exports = new AdminService();
