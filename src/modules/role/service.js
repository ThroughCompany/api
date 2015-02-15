/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var Role = require('./data/model');

/* =========================================================================
 * Constructor
 * ========================================================================= */

var RoleService = function() {
  CommonService.call(this, Role);
};
util.inherits(RoleService, CommonService);

/**
 * @param {object} options
 * @param {function} next - callback
 */
RoleService.prototype.getAll = function getAll(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var query = Role.find({});

  return query.exec(next);
};

// public api ===============================================================================
module.exports = new RoleService();
