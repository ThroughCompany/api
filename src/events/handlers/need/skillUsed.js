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
 * Constants
 * ========================================================================= */
var NEED_TYPES = require('modules/need/constants/needTypes');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.skillId) return next(new errors.InvalidArgumentError('options.skillId is required'));
  if (!options.type) return next(new errors.InvalidArgumentError('options.type is required'));

  if (options.type === NEED_TYPES.ORGANIZATION) {
    skillService.updateSkillOrganizationUseCount({
      skillId: options.skillId
    }, next);
  } else if (options.type === NEED_TYPES.USER) {
    skillService.updateSkillUserUseCount({
      skillId: options.skillId
    }, next);
  } else if (options.type === NEED_TYPES.PROJECT) {
    skillService.updateSkillProjectUseCount({
      skillId: options.skillId
    }, next);
  } else {
    return next(new errors.InvalidArgumentError(options.type + ' is not a valid need type'));
  }
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
