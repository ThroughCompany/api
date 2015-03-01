/* =========================================================================
 * Dependencies
 * ========================================================================= */

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  if (!data.name) return next(new errors.InvalidArgumentError('Name is required'));
  if (!data.shortDescription) return next(new errors.InvalidArgumentError('Short Description is required'));
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
  next();
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
