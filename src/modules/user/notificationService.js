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
var messageService = require('modules/message');

//models
var User = require('modules/user/data/model');
var Application = require('modules/application/data/applicationModel');
var Need = require('modules/need/data/needModel');

//libs
var mailgunApi = require('lib/mailgun-api');

/* =========================================================================
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

var USER_CREATED_EMAIL_PATH = __dirname + '/notifications/userCreated/email.html';
var USER_CREATED_EMAIL_SUBJECT = 'Welcome to Through Company';

var APPLICATION_CREATED_EMAIL_PATH = __dirname + '/notifications/applicationCreated/email.html';
var APPLICATION_CREATED_EMAIL_SUBJECT = 'Someone has applied to your need on Through Company';

/* =========================================================================
 * Constructor
 * ========================================================================= */
function UserNotificationService() {}

/**
 * @param {object} options
 */
UserNotificationService.prototype.sendCreatedNotifications = function sendCreatedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;
  var user = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getUserCreatedData(options, function(err, data) {
        if (err) return done(err);

        user = data.user;

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generateGenericEmail({
        templateFilePath: USER_CREATED_EMAIL_PATH,
        templateData: {
          user: user
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      var emailAddresses = [user.email];

      sendUsersEmail(emailAddresses, emailText, USER_CREATED_EMAIL_SUBJECT, done);
    }
  ], function(err) {
    if (err) return next(err);

    return next(null, user.id);
  });
};

/**
 * @param {object} options
 */
UserNotificationService.prototype.sendApplicationCreatedNotifications = function sendApplicationCreatedNotifications(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.applicationId) return next(new errors.InvalidArgumentError('Application Id is required'));

  var _this = this;
  var user = null;
  var application = null;
  var need = null;
  var createdByUser = null;

  async.waterfall([
    function getNotificationData_step(done) {
      getApplicationCreatedData(options, function(err, data) {
        if (err) return done(err);

        user = data.user;
        application = data.application;
        need = data.need;
        createdByUser = data.createdByUser;

        return done(null);
      });
    },
    function generateEmailTemplate_step(done) {
      templateService.generateGenericEmail({
        templateFilePath: APPLICATION_CREATED_EMAIL_PATH,
        templateData: {
          createdByUser: createdByUser,
          user: user,
          application: application,
          need: need
        }
      }, done);
    },
    function sendNotifications_step(emailText, done) {
      var emailAddresses = [user.email];

      async.parallel([
        function sendEmails_step(cb) {
          sendUsersEmail(emailAddresses, emailText, APPLICATION_CREATED_EMAIL_SUBJECT, cb);
        },
        function sendMessage_step(cb) {
          sendUsersMessage([createdByUser._id], 'Your application has been sent', cb);
        },
        function sendMessage_step(cb) {
          sendUsersMessage([user._id], 'A user has apply to one of your needs', cb);
        }
      ], done);
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
function getUserCreatedData(options, next) {
  async.parallel({
    user: function findUserById_step(done) {
      userService.getById({
        userId: options.userId
      }, done);
    }
  }, next);
}

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
    user: function findUserById_step(done) {
      userService.getById({
        userId: options.userId
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

function sendUsersMessage(userIds, message, next) {
  var steps = [];

  _.each(userIds, function(userId) {
    steps.push(function(done) {
      messageService.create({
        userId: userId,
        message: message
      }, done);
    });
  });

  async.parallel(steps, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new UserNotificationService();
