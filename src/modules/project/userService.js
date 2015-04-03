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
var User = require('modules/user/data/model');
var Project = require('modules/project/data/projectModel');
var ProjectUser = require('modules/project/data/userModel');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ProjectUserService = function() {
  CommonService.call(this, ProjectUser);
};
util.inherits(ProjectUserService, CommonService);

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
ProjectUserService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  var query = ProjectUser.find({
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
module.exports = new ProjectUserService();
