/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');

//services
var assetTagService = require('modules/assetTag');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.assetTagName) return next(new errors.InvalidArgumentError('options.assetTagName is required'));

  assetTagService.updateTagProjectUseCount({
    name: options.assetTagName
  }, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
