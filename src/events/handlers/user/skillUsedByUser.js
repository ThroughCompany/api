/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');

//services
var skillService = require('modules/skill');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.skillId) return next(new errors.InvalidArgumentError('options.skillId is required'));

  skillService.updateSkillUserUseCount({
    skillId: options.skillId
  }, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
