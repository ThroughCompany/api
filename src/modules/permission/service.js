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

// public api ===============================================================================
module.exports = new PermissionService();
