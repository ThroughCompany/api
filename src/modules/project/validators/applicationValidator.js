/* =========================================================================
 * Dependencies
 * ========================================================================= */

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
