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

//models
var User = require('modules/user/data/model');
var Project = require('./data/projectModel');
var ProjectUser = require('modules/project/data/userModel');

//libs
var mailgunApi = require('lib/mailgun-api');

/* =========================================================================
 * Constants
 * ========================================================================= */

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
    }
  }, function(err, results) {
    if (err) return next(err);

    var project = results.project;
    var projectApplication = results.projectApplication;
    var user = results.user;

    if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

    next();
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectNotificationService();
