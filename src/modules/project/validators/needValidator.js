/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var FIELD_LENGTHS = require('../constants/fieldLengths');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(projectNeed, data, next) {
  baseValidate(projectNeed, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(projectNeed, data, next) {
  var steps = [];

  if (data.description && data.description.lengths > FIELD_LENGTHS.NEED_DESCRIPTION) return next(new errors.InvalidArgumentError('Need Description cannot be longer than ' + FIELD_LENGTHS.NEED_DESCRIPTION + ' charachters'));

  if (data.timeCommitment) {
    if (data.timeCommitment.hoursPerWeek && data.timeCommitment.totalHours) return next(new errors.InvalidArgumentError('Cannot have both a timeCommitment.hoursPerWeek and timeCommitment.totalHours'));
  }

  if (data.duration) {
    if (data.duration.startDate) {
      data.duration.startDate = new Date(data.duration.startDate);

      if (!_.isDate(data.duration.startDate)) return next(new errors.InvalidArgumentError('Duration Start Date must be a valid date'));
    }
    if (data.duration.endDate) {
      data.duration.endDate = new Date(data.duration.endDate);
      if (!_.isDate(data.duration.endDate)) return next(new errors.InvalidArgumentError('Duration End Date must be a valid date'));
    }
  }

  if (data.locationSpecific && !_.isBoolean(data.locationSpecific)) return next(new errors.InvalidArgumentError('Location Specific must be a boolean'));

  async.series(steps, function(err) {
    return next(err);
  });
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
