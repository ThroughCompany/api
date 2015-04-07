/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var logger = require('modules/logger');
var userService = require('modules/user');
var projectApplicationService = require('modules/project/applicationService');
var projectUserService = require('modules/project/userService');
var permissionService = require('modules/permission');

//models
var User = require('modules/user/data/model');
var Project = require('./data/projectModel');
var ProjectUser = require('modules/project/data/userModel');

//libs
var mailgunApi = require('lib/mailgun-api');
var templateService = require('lib/services/templateService');

/* =========================================================================
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function ProjectNotificationService() {}

/**
 * @param {object} options
 */
ProjectNotificationService.prototype.sendApplicationCreateNotifications = function sendApplicationCreateNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));

  async.parallel({
    projectApplication: function findProjectApplicationById_step(done) {
      projectApplicationService.getById({
        projectApplicationId: options.projectApplicationId
      }, done);
    },
    user: function findUserById_step(done) {
      userService.getById({
        userId: options.userId
      }, done);
    },
    project: function findProjectById_step(done) {
      Project.findById(options.projectId, done);
    },
    projectUsers: function findProjectUsersByProjectId_step(done) {
      projectUserService.getByProjectId({
        projectId: options.projectId
      }, done);
    },
    addProjectUsersPermission: function findPermissionById_step(done) {
      permissionService.getByName({
        name: PERMISSION_NAMES.ADD_PROJECT_USERS
      }, done);
    }
  }, function(err, results) {
    if (err) return next(err);

    var project = results.project;
    var projectUsers = results.projectUsers;
    var projectApplication = results.projectApplication;
    var user = results.user;
    var addProjectUsersPermission = results.addProjectUsersPermission;

    if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

    async.waterfall([
      function generateEmailTemplate_step(done) {
        templateService.generate({
          templateFilePath: __dirname + '/notifications/applicationCreated/email.html',
          templateData: {
            user: user,
            project: project,
            projectApplication: projectApplication
          }
        }, done);
      },
      function sendNotifications_step(emailText, done) {
        var projectUsers = _.filter(projectUsers, function(projectUser) {
          var hasPermission = _.contains(projectUser.permission, addProjectUsersPermission._id);
        });

        
      }
    ], next);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectNotificationService();
