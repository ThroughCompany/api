/* =========================================================================
 * Dependencies
 * ========================================================================= */
//modules
var errors = require('modules/error');

//services
var organizationNotificationService = require('modules/organization/notificationService');
var userNotificationService = require('modules/user/notificationService');
var projectNotificationService = require('modules/project/notificationService');

/* =========================================================================
 * Event Handler
 * ========================================================================= */
function eventHandler(options, next) {
  if (!options) return next(new errors.InternalServiceError('options is required'));
  if (!options.projectId && !options.userId && !options.organizationId) return next(new errors.InvalidArgumentError('Organization Id, User Id, or Project Id is required'));
  if (!options.createdByUserId) return next(new errors.InternalServiceError('Created By User Id is required'));
  if (!options.applicationId) return next(new errors.InternalServiceError('Application Id is required'));

  if (options.organizationId) {
    organizationNotificationService.sendApplicationCreatedNotifications({
      organizationId: options.organizationId,
      createdByUserId: options.createdByUserId,
      applicationId: options.applicationId
    }, next);
  } else if (options.userId) {
    userNotificationService.sendApplicationCreatedNotifications({
      userId: options.userId,
      createdByUserId: options.createdByUserId,
      applicationId: options.applicationId
    }, next);
  } else {
    projectNotificationService.sendApplicationCreatedNotifications({
      projectId: options.projectId,
      createdByUserId: options.createdByUserId,
      applicationId: options.applicationId
    }, next);
  }
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = eventHandler;
