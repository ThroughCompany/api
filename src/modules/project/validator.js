/* =========================================================================
 * Dependencies
 * ========================================================================= */

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var FIELD_LENGTHS = require('./constants/fieldLengths');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  if (!data.name) return next(new errors.InvalidArgumentError('Name is required'));
  if (!data.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));

  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(user, data, next) {
  baseValidate(user, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(project, data, next) {
  if (data.description && data.description.length > FIELD_LENGTHS.DESCRIPTION) return next(new errors.InvalidArgumentError('description cannot be longer than ' + FIELD_LENGTHS.DESCRIPTION));

  next();
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
