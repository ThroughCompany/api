/* =========================================================================
 * Dependencies
 * ========================================================================= */

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var REGEXES = require('modules/common/constants/regexes');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  if (!data.email) return next(new errors.InvalidArgumentError('Email is required'));
  if (!data.password) return next(new errors.InvalidArgumentError('Password is required'));

  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(user, data, next) {
  baseValidate(user, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(user, data, next) {
  if (data.email && !REGEXES.email.test(data.email)) return next(new errors.InvalidArgumentError(data.email + ' is not a valid email address'));
  if (data.password && data.password.length < 6) return next(new errors.InvalidArgumentError('Password must be at least 6 characters'));

  next();
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
