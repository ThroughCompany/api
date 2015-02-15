/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

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
PermissionService.prototype.getAll = function getAll(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var query = Permission.find({});

  return query.exec(next);
};

// public api ===============================================================================
module.exports = new PermissionService();
