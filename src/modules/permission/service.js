/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//services
var roleService = require('modules/role');

//models
var Permission = require('./data/model');

/* =========================================================================
 * Constructor
 * ========================================================================= */

var PermissionService = function() {
  CommonService.call(this, Permission);
};
util.inherits(PermissionService, CommonService);

/**
 * @param {object} options
 * @param {function} next - callback
 */
PermissionService.prototype.getByRoleName = function getByRoleName(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.roleName) return next(new errors.InvalidArgumentError('Role Name is required'));

  var _this = this;
  var role = null;

  async.waterfall([
    function getRoleByName_step(done) {
      roleService.getByName({
        roleName: options.roleName
      }, done);
    },
    function getPermissionsByRoleId(_role, done) {
      role = _role;

      var query = Permission.find({
        roles: role._id
      });

      query.exec(done);
    }
  ], next);
};

/**
 * @param {object} options
 * @param {array} options.ids
 * @param {function} next - callback
 */
// PermissionService.prototype.getByIds = function getByIds(options, next) {
//   if (!options) return next(new errors.InvalidArgumentError('options is required'));
//   if (!options.ids || !_.isArray(options.ids)) return next(new errors.InvalidArgumentError('Ids is required'));

//   var _this = this;
//   var role = null;

//   var query = Permission.find({
//     _id: {
//       $in: options.ids
//     }
//   });

//   query.exec(next);
// };

/**
 * @param {object} options
 * @param {array} options.ids
 * @param {function} next - callback
 */
PermissionService.prototype.getAll = function getAll(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var _this = this;

  var conditions = {};

  var query = Permission.find(conditions);

  query.exec(next);
};

/**
 * @param {object} options
 * @param {array} options.name
 * @param {function} next - callback
 */
PermissionService.prototype.getByName = function getByName(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;

  var query = Permission.findOne({
    name: options.name
  });

  query.exec(next);
};

// public api ===============================================================================
module.exports = new PermissionService();
