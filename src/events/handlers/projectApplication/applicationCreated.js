/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var logger = require('modules/logger');

//services
var projectApplicationService = require('modules/projectApplication');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  logger.warn('NOT IMPLEMENTED');
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
