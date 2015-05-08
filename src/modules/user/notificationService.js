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
var projectUserService = require('modules/project/userService');
var permissionService = require('modules/permission');
var templateService = require('modules/template');

//models
var User = require('modules/user/data/model');

//libs
var mailgunApi = require('lib/mailgun-api');

/* =========================================================================
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

var USER_CREATED_EMAIL_PATH = __dirname + '/notifications/userCreated/email.html';
var USER_CREATED_EMAIL_SUBJECT = 'Welcome to Through Company';

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

      sendUsersEmail(emailAddresses, emailText, done);
    }
  ], function(err) {
    if (err) return next(err);

    return next(null, user.id);
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

function sendUsersEmail(emailAddresses, html, next) {
  var steps = [];

  _.each(emailAddresses, function(emailAddress) {
    steps.push(function(done) {
      mailgunApi.sendEmail({
        html: html,
        from: appConfig.app.systemEmail,
        to: emailAddress,
        subject: USER_CREATED_EMAIL_SUBJECT
      }, done);
    });
  });

  async.parallel(steps, next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new UserNotificationService();
