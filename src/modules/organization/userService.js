/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var userService = require('modules/user');
var permissionService = require('modules/permission');

//models
var OrganizationUser = require('modules/organization/data/userModel');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Constructor
 * ========================================================================= */
var OrganizationUserService = function() {
  CommonService.call(this, OrganizationUser);
};
util.inherits(OrganizationUserService, CommonService);

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
OrganizationUserService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  var query = OrganizationUser.find({
    user: options.userId
  });

  query.exec(next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new OrganizationUserService();
