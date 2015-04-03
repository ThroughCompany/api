var projectService = require('./projectService');
var projectApplicationService = require('./applicationService');
var projectNotificationService = require('./notificationService');

module.exports = projectService;
module.exports.applications = projectApplicationService;
module.exports.notifications = projectNotificationService;
