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
var organizationUserService = require('modules/organization/userService');
var permissionService = require('modules/permission');
var templateService = require('modules/template');
var messageService = require('modules/message');

//models
var User = require('modules/user/data/model');
var Organization = require('./data/organizationModel');
var OrganizationUser = require('modules/organization/data/userModel');
var Application = require('modules/application/data/applicationModel');
var Need = require('modules/need/data/needModel');

//libs
var mailgunApi = require('lib/mailgun-api');

/* =========================================================================
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

var APPLICATION_CREATED_EMAIL_PATH = __dirname + '/notifications/applicationCreated/email.html';
var APPLICATION_CREATED_EMAIL_SUBJECT = 'Someone has applied to your organization\s need on Through Company';

/* =========================================================================
 * Constructor
 * ========================================================================= */
function OrganizationNotificationService() {}

/**
 * @param {object} options
 */
OrganizationNotificationService.prototype.sendApplicationCreatedNotifications = function sendApplicationCreatedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.applicationId) return next(new errors.InvalidArgumentError('Application Id is required'));

  var _this = this;
  var organization = null;
  var organizationUsers = null;
  var users = null;
  var application = null;
  var need = null;
  var createdByUser = null;
  var addOrganizationUsersPermission = null;
  var organizationUsersWithPermissions = null;
  var usersWithPermissions = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationCreatedData(options, function(err, data) {
        if (err) return done(err);

        organization = data.organization;
        organizationUsers = data.organizationUsers;
        users = data.users;
        application = data.application;
        need = data.need;
        createdByUser = data.createdByUser;
        addOrganizationUsersPermission = data.addOrganizationUsersPermission;

        if (!organization) return done(new errors.ObjectNotFoundError('Organization not found'));

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generateGenericEmail({
        templateFilePath: APPLICATION_CREATED_EMAIL_PATH,
        templateData: {
          createdByUser: createdByUser,
          organization: organization,
          application: application,
          need: need
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      organizationUsersWithPermissions = _.filter(organizationUsers, function(organizationUser) {
        var hasPermission = _.contains(organizationUser.permissions, addOrganizationUsersPermission._id);

        return hasPermission;
      });

      usersWithPermissions = _.filter(users, function(user) {
        var organizationUser = _.find(organizationUsers, function(organizationUser) {
          return organizationUser.user === user._id;
        });

        return organizationUser ? organizationUser : null;
      });

      if (!usersWithPermissions || !usersWithPermissions.length) {
        logger.warn('Organization does not have users with ADD_ORGANIZATION_USERS permission');
        return done(null);
      }

      //TODO: email does not live on the organizationUser - it's on the user object - NEED TO FIX THIS!!!
      var emailAddresses = _.pluck(usersWithPermissions, 'email');

      async.parallel([
        function sendEmails_step(cb) {
          sendUsersEmail(emailAddresses, emailText, APPLICATION_CREATED_EMAIL_SUBJECT, cb);
        },
        function sendMessage_step(cb) {
          sendUsersMessage([createdByUser._id], 'Your application has been sent', cb);
        },
        function sendMessage_step(cb) {
          sendUsersMessage([_.pluck(usersWithPermissions, '_id')], 'A user has apply to one of your needs', cb);
        }
      ], done);
    }
  ], function(err) {
    if (err) return next(err);

    var notifiedUserIds = _.pluck(usersWithPermissions, '_id');

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
    need: ['application', function findNeed_step(done, results) {
      var application = results.application;

      Need.findById(application.need, done);
    }],
    createdByUser: function findUserById_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    organization: function findOrganizationById_step(done) {
      Organization.findById(options.organizationId, done);
    },
    organizationUsers: function findOrganizationUsersByOrganizationId_step(done) {
      organizationUserService.getByOrganizationId({
        organizationId: options.organizationId
      }, done);
    },
    users: ['organizationUsers', function findUsers_step(done, results) {
      var userIds = _.pluck(results.organizationUsers, 'user');

      User.find({
        _id: {
          $in: userIds
        }
      }, done);
    }],
    addOrganizationUsersPermission: function findPermissionById_step(done) {
      permissionService.getByName({
        name: PERMISSION_NAMES.ADD_ORGANIZATION_USERS
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

function sendUsersMessage(userIds, messageBody, next) {
  var steps = [];

  _.each(userIds, function(userId) {
    steps.push(function(done) {
      messageService.create({
        userId: userId,
        message: messageBody
      }, done);
    });
  });

  async.parallel(steps, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new OrganizationNotificationService();
