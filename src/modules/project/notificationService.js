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
var projectApplicationService = require('modules/project/applicationService');
var projectUserService = require('modules/project/userService');
var permissionService = require('modules/permission');
var templateService = require('modules/template');

//models
var User = require('modules/user/data/model');
var Project = require('./data/projectModel');
var ProjectUser = require('modules/project/data/userModel');

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
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var projectApplication = null;
  var user = null;
  var addProjectUsersPermission = null;
  var projectUsersWithPermissions = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationCreatedData(options, function(err, data) {
        if (err) return done(err);

        project = data.project;
        projectUsers = data.projectUsers;
        projectApplication = data.projectApplication;
        user = data.user;
        addProjectUsersPermission = data.addProjectUsersPermission;

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generate({
        templateFilePath: APPLICATION_CREATED_EMAIL_PATH,
        templateData: {
          user: user,
          project: project,
          projectApplication: projectApplication
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      projectUsersWithPermissions = _.filter(projectUsers, function(projectUser) {
        var hasPermission = _.contains(projectUser.permissions, addProjectUsersPermission._id);

        return hasPermission;
      });

      if (!projectUsersWithPermissions || !projectUsersWithPermissions.length) {
        logger.warn('Project does not have users with ADD_PROJECT_USERS permission');
        return done(null);
      }

      //TODO: email does not live on the projectUser - it's on the user object - NEED TO FIX THIS!!!
      var emailAddresses = _.pluck(projectUsersWithPermissions, 'email');

      sendUsersEmail(emailAddresses, emailText, APPLICATION_CREATED_EMAIL_SUBJECT, done);
    }
  ], function(err) {
    if (err) return next(err);

    var notifiedUserIds = _.pluck(projectUsersWithPermissions, 'user');

    return next(null, notifiedUserIds);
  });
};

/**
 * @param {object} options
 */
ProjectNotificationService.prototype.sendApplicationApprovedNotifications = function sendApplicationApprovedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var projectApplication = null;
  var user = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationApprovedData(options, function(err, data) {
        if (err) return done(err);

        project = data.project;
        projectUsers = data.projectUsers;
        projectApplication = data.projectApplication;
        user = data.user;

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generate({
        templateFilePath: APPLICATION_APPROVED_EMAIL_PATH,
        templateData: {
          user: user,
          project: project,
          projectApplication: projectApplication
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

    var notifiedUserIds = [user._id];

    return next(null, notifiedUserIds);
  });
};

/**
 * @param {object} options
 */
ProjectNotificationService.prototype.sendApplicationDeclinedNotifications = function sendApplicationDeclinedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var projectApplication = null;
  var user = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationApprovedData(options, function(err, data) {
        if (err) return done(err);

        project = data.project;
        projectUsers = data.projectUsers;
        projectApplication = data.projectApplication;
        user = data.user;

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generate({
        templateFilePath: APPLICATION_DECLINED_EMAIL_PATH,
        templateData: {
          user: user,
          project: project,
          projectApplication: projectApplication
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      //TODO: email does not live on the projectUser - it's on the user object - NEED TO FIX THIS!!!
      var emailAddresses = [user.email];

      sendUsersEmail(emailAddresses, emailText, APPLICATION_DECLINED_EMAIL_SUBJECT, done);
    }
  ], function(err) {
    if (err) return next(err);

    var notifiedUserIds = [user._id];

    return next(null, notifiedUserIds);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function getApplicationCreatedData(options, next) {
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
  }, next);
}

function getApplicationApprovedData(options, next) {
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
