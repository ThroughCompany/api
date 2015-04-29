/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var APPLICATION_STATUSES = require('modules/project/constants/applicationStatuses');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(projectApplication, data, next) {
  baseValidate(projectApplication, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(projectApplication, data, next) {
  var steps = [];

  if (data.status && !_.contains(_.values(APPLICATION_STATUSES), data.status)) return next(new errors.InvalidArgumentError(data.status + ' is not a valid project application status'));

  async.series(steps, function(err) {
    return next(err);
  });
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
