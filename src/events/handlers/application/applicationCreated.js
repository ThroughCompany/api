/* =========================================================================
 * Dependencies
 * ========================================================================= */
//modules
var errors = require('modules/error');

//services
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
    return next(new errors.NotImplementedError());
  } else if (options.userId) {
    return next(new errors.NotImplementedError());
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
