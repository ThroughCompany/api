var projectService = require('./projectService');
var projectApplicationService = require('./applicationService');
var projectNotificationService = require('./notificationService');
var projectUserService = require('./userService');

module.exports = projectService;
module.exports.applications = projectApplicationService;
module.exports.notifications = projectNotificationService;
module.exports.users = projectUserService;
