/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var projectService = require('modules/project');
var userService = require('modules/user');

//models
var ProjectApplication = require('modules/projectApplication/data/model');
var ProjectUser = require('modules/projectUser/data/model');

var validator = require('./validator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var STATUSES = require('./constants/statuses');

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
          projectService.getById({
            projectId: options.projectId
              //fields: 'projectUsers(), projectApplications()'
          }, cb);
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
        projectUsers = results[1];
        projectApplications = results[2];

        return done(null);
      });
    },
    function getUserById_step(done) {
      // console.log(_project);

      // console.log('PROJECT APPLICATIONS');
      // console.log(project.projectApplications);
      // //console.log(_.pluck(project.projectApplications, 'user'));
      // console.log('USER ID');
      // console.log(options.userId);

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

      console.log(project);

      project.save(function(err) {
        if (err) return done(err);
        return done(null);
      });
    },
    function updateUserWithApplications_step(done) {
      user.projectApplications.push(projectApplication._id);
      user.save(function(err) {
        if (err) return done(err);
        return done(null, project);
      });
    }
  ], next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectApplicationService();
