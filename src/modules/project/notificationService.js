/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

var appConfig = require('src/config/app-config');

//modules
var errors = require('modules/error');
var logger = require('modules/logger');
var userService = require('modules/user');
var applicationService = require('modules/application');
var projectUserService = require('modules/project/userService');
var permissionService = require('modules/permission');
var templateService = require('modules/template');

//models
var User = require('modules/user/data/model');
var Project = require('./data/projectModel');
var ProjectUser = require('modules/project/data/userModel');
var Application = require('modules/application/data/applicationModel');

//libs
var mailgunApi = require('lib/mailgun-api');

/* =========================================================================
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

var APPLICATION_CREATED_EMAIL_PATH = __dirname + '/notifications/applicationCreated/email.html';
var APPLICATION_CREATED_EMAIL_SUBJECT = 'Some has applied to join your project on Through Company';

var APPLICATION_APPROVED_EMAIL_PATH = __dirname + '/notifications/applicationApproved/email.html';
var APPLICATION_APPROVED_EMAIL_SUBJECT = 'You have been accepted to join a project on Through Company';

var APPLICATION_DECLINED_EMAIL_PATH = __dirname + '/notifications/applicationDeclined/email.html';
var APPLICATION_DECLINED_EMAIL_SUBJECT = 'You have been declined to join a project on Through Company';

/* =========================================================================
 * Constructor
 * ========================================================================= */
function ProjectNotificationService() {}

/**
 * @param {object} options
 */
ProjectNotificationService.prototype.sendApplicationCreatedNotifications = function sendApplicationCreatedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.applicationId) return next(new errors.InvalidArgumentError('Application Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var users = null;
  var applicationId = null;
  var createdByUser = null;
  var addProjectUsersPermission = null;
  var projectUsersWithPermissions = null;
  var usersWithPermissions = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationCreatedData(options, function(err, data) {
        if (err) return done(err);

        project = data.project;
        projectUsers = data.projectUsers;
        users = data.users;
        applicationId = data.applicationId;
        createdByUser = data.createdByUser;
        addProjectUsersPermission = data.addProjectUsersPermission;

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generate({
        templateFilePath: APPLICATION_CREATED_EMAIL_PATH,
        templateData: {
          createdByUser: createdByUser,
          project: project,
          applicationId: applicationId
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      projectUsersWithPermissions = _.filter(projectUsers, function(projectUser) {
        var hasPermission = _.contains(projectUser.permissions, addProjectUsersPermission._id);

        return hasPermission;
      });

      usersWithPermissions = _.filter(users, function(user) {
        var projectUser = _.find(projectUsers, function(projectUser) {
          return projectUser.user === user._id;
        });

        return projectUser ? projectUser : null;
      });

      if (!usersWithPermissions || !usersWithPermissions.length) {
        logger.warn('Project does not have users with ADD_PROJECT_USERS permission');
        return done(null);
      }

      //TODO: email does not live on the projectUser - it's on the user object - NEED TO FIX THIS!!!
      var emailAddresses = _.pluck(usersWithPermissions, 'email');

      sendUsersEmail(emailAddresses, emailText, APPLICATION_CREATED_EMAIL_SUBJECT, done);
    }
  ], function(err) {
    if (err) return next(err);

    var notifiedUserIds = _.pluck(usersWithPermissions, '_id');

    return next(null, notifiedUserIds);
  });
};

/**
 * @param {object} options
 */
ProjectNotificationService.prototype.sendApplicationApprovedNotifications = function sendApplicationApprovedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.applicationId) return next(new errors.InvalidArgumentError('Application Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var applicationId = null;
  var createdByUser = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationApprovedData(options, function(err, data) {
        if (err) return done(err);

        project = data.project;
        projectUsers = data.projectUsers;
        applicationId = data.applicationId;
        createdByUser = data.createdByUser;

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generate({
        templateFilePath: APPLICATION_APPROVED_EMAIL_PATH,
        templateData: {
          createdByUser: createdByUser,
          project: project,
          applicationId: applicationId
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      //TODO: email does not live on the projectUser - it's on the user object - NEED TO FIX THIS!!!
      var emailAddresses = [user.email];

      sendUsersEmail(emailAddresses, emailText, APPLICATION_APPROVED_EMAIL_PATH, done);
    }
  ], function(err) {
    if (err) return next(err);

    var notifiedUserIds = [createdByUser._id];

    return next(null, notifiedUserIds);
  });
};

/**
 * @param {object} options
 */
ProjectNotificationService.prototype.sendApplicationDeclinedNotifications = function sendApplicationDeclinedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.applicationId) return next(new errors.InvalidArgumentError('Application Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var applicationId = null;
  var createdByUser = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationApprovedData(options, function(err, data) {
        if (err) return done(err);

        project = data.project;
        projectUsers = data.projectUsers;
        applicationId = data.applicationId;
        createdByUser = data.createdByUser;

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generate({
        templateFilePath: APPLICATION_DECLINED_EMAIL_PATH,
        templateData: {
          createdByUser: createdByUser,
          project: project,
          applicationId: applicationId
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      //TODO: email does not live on the projectUser - it's on the user object - NEED TO FIX THIS!!!
      var emailAddresses = [createdByUser.email];

      sendUsersEmail(emailAddresses, emailText, APPLICATION_DECLINED_EMAIL_SUBJECT, done);
    }
  ], function(err) {
    if (err) return next(err);

    var notifiedUserIds = [createdByUser._id];

    return next(null, notifiedUserIds);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function getApplicationCreatedData(options, next) {
  async.auto({
    application: function findApplicationById_step(done) {
      applicationService.getById({
        applicationId: options.applicationId
      }, done);
    },
    createdByUser: function findUserById_step(done) {
      userService.getById({
        userId: options.createdByUserId
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
    users: ['projectUsers', function findUsers_step(done, results) {
      var userIds = _.pluck(results.projectUsers, 'user');

      User.find({
        _id: {
          $in: userIds
        }
      }, done);
    }],
    addProjectUsersPermission: function findPermissionById_step(done) {
      permissionService.getByName({
        name: PERMISSION_NAMES.ADD_PROJECT_USERS
      }, done);
    }
  }, next);
}

function getApplicationApprovedData(options, next) {
  async.parallel({
    applicationId: function findApplicationById_step(done) {
      applicationService.getById({
        applicationId: options.applicationId
      }, done);
    },
    createdByUser: function findUserById_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    project: function findProjectById_step(done) {
      Project.findById(options.projectId, done);
    },
    projectUsers: function findProjectUsersByProjectId_step(done) {
      projectUserService.getByProjectId({
        projectId: options.projectId
      }, done);
    }
  }, next);
}

function sendUsersEmail(emailAddresses, html, subject, next) {
  var steps = [];

  _.each(emailAddresses, function(emailAddress) {
    steps.push(function(done) {
      mailgunApi.sendEmail({
        html: html,
        from: appConfig.app.systemEmail,
        to: emailAddress,
        subject: subject
      }, done);
    });
  });

  async.parallel(steps, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectNotificationService();
