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
var projectNotificationService = require('modules/project/notificationService');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InternalServiceError('options is required'));
  if (!options.projectId) return next(new errors.InternalServiceError('Project Id is required'));
  if (!options.userId) return next(new errors.InternalServiceError('User Id is required'));
  if (!options.projectApplicationId) return next(new errors.InternalServiceError('Project Application Id is required'));

  projectNotificationService.sendApplicationApprovedNotifications({
    projectId: options.projectId,
    userId: options.userId,
    projectApplicationId: options.projectApplicationId
  }, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
