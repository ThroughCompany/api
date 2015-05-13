/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var APPLICATION_STATUSES = require('modules/application/constants/applicationStatuses');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(application, data, next) {
  baseValidate(application, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(application, data, next) {
  var steps = [];

  if (data.status) {
    if (!_.contains(_.values(APPLICATION_STATUSES), data.status)) return next(new errors.InvalidArgumentError(data.status + ' is not a valid application status'));
    if (application) {
      if (application.status === APPLICATION_STATUSES.APPROVED || application.status === APPLICATION_STATUSES.DECLINED) return next(new errors.InvalidArgumentError(APPLICATION_STATUSES.APPROVED + ' or ' + APPLICATION_STATUSES.DECLINED + ' application status cannot be updated'));
    }
  }

  async.series(steps, function(err) {
    return next(err);
  });
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
