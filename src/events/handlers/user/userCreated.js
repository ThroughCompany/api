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
var userNotificationService = require('modules/user/notificationService');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InternalServiceError('options is required'));
  if (!options.userId) return next(new errors.InternalServiceError('User Id is required'));

  userNotificationService.sendCreatedNotifications({
    userId: options.userId
  }, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
