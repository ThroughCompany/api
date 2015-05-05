/* =========================================================================
 * Dependencies
 * ========================================================================= */
var projectService = require('./projectService');
var projectNeedService = require('./needService');
var projectApplicationService = require('./applicationService');
var projectNotificationService = require('./notificationService');
var projectUserService = require('./userService');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');

/* =========================================================================
 * Events
 * ========================================================================= */
//application service events
projectApplicationService.on(EVENTS.PROJECT_APPLICATION_CREATED, function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(EVENTS.PROJECT_APPLICATION_CREATED);

  projectService.emit.apply(projectService, args);
});

projectApplicationService.on(EVENTS.PROJECT_APPLICATION_APPROVED, function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(EVENTS.PROJECT_APPLICATION_APPROVED);

  projectService.emit.apply(projectService, args);
});

projectApplicationService.on(EVENTS.PROJECT_APPLICATION_DECLINED, function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(EVENTS.PROJECT_APPLICATION_DECLINED);

  projectService.emit.apply(projectService, args);
});

//need service events
projectNeedService.on(EVENTS.SKILL_USED_BY_PROJECT, function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(EVENTS.SKILL_USED_BY_PROJECT);

  projectService.emit.apply(projectService, args);
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = projectService;
module.exports.applications = projectApplicationService;
module.exports.notifications = projectNotificationService;
module.exports.users = projectUserService;
