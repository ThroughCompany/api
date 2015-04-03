/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var userService = require('modules/user');

//models
var ProjectApplication = require('modules/project/data/applicationModel');
var ProjectUser = require('modules/projectUser/data/model');
var Project = require('modules/project/data/projectModel');

var applicationValidator = require('./validators/applicationValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var STATUSES = require('./constants/applicationStatuses');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ProjectApplicationService = function() {
  CommonService.call(this, ProjectApplication);
};
util.inherits(ProjectApplicationService, CommonService);

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {function} next - callback
 */
ProjectApplicationService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var projectApplications = null;

  var user = null;
  var projectApplication = null;

  async.waterfall([
    function getProjectByData_step(done) {
      async.parallel([
        function getProjectById_step(cb) {
          Project.findById(options.projectId, cb);
        },
        function getProjectUsersById_step(cb) {
          ProjectUser.find({
            project: options.projectId
          }, cb);
        },
        function getProjectApplicationsById_step(cb) {
          ProjectApplication.find({
            project: options.projectId
          }, cb);
        }
      ], function(err, results) {
        if (err) return done(err);

        project = results[0];

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        projectUsers = results[1];
        projectApplications = results[2];

        return done(null);
      });
    },
    function getUserById_step(done) {
      if (_.contains(_.pluck(projectUsers, 'user'), options.userId)) {
        return done(new errors.InvalidArgumentError('User ' + options.userId + ' is already a member of this project'));
      }
      if (_.contains(_.pluck(projectApplications, 'user'), options.userId)) {
        return done(new errors.InvalidArgumentError('User ' + options.userId + ' has already applied to this project'));
      }

      userService.getById({
        userId: options.userId
      }, done);
    },
    function createProjectApplication_step(_user, done) {
      user = _user;

      var projectApplication = new ProjectApplication();
      projectApplication.project = project._id;
      projectApplication.user = user._id;
      projectApplication.status = STATUSES.PENDING;

      projectApplication.save(function(err, application) {
        if (err) return done(err);
        return done(null, application);
      });
    },
    function updateProjectWithApplications_step(_projectApplication, done) {
      projectApplication = _projectApplication;

      project.projectApplications.push(projectApplication._id);

      project.save(function(err) {
        if (err) return done(err);
        return done(null);
      });
    },
    function updateUserWithApplications_step(done) {
      user.projectApplications.push(projectApplication._id);
      user.save(function(err) {
        if (err) return done(err);
        return done(null, projectApplication);
      });
    }
  ], next);
};

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {function} next - callback
 */
ProjectApplicationService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));

  var _this = this;

  var query = ProjectApplication.findOne({
    _id: options.projectApplicationId
  });

  query.exec(function(err, projectApplication) {
    if (err) return next(err);
    if (!projectApplication) return next(new errors.ObjectNotFoundError('Project Application not found'));

    return next(null, projectApplication);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectApplicationService();
