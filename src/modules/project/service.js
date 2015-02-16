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
var permissionService = require('modules/permission');

//models
var User = require('modules/user/data/model');
var Project = require('./data/model');
var ProjectUser = require('modules/project-user/data/model');

/* =========================================================================
 * Constants
 * ========================================================================= */
var ROLES = require('modules/role/constants/role-names');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ProjectService = function() {
  CommonService.call(this, Project);
};
util.inherits(ProjectService, CommonService);

/**
 * @param {object} options
 * @param {string} createdBydUserId
 * @param {string} name
 * @param {function} next - callback
 */
ProjectService.prototype.create = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;
  var user = null;
  var project = null;
  var projectUser = null;
  var permissions = null;

  async.waterfall([
    function findUserByUserId_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    function createProject_step(_user, done) {
      user = _user;

      var project = new Project();
      project.name = options.name;

      project.save(done);
    },
    function getProjectUserPermissions_step(_project, numCreated, done) {
      project = _project;

      permissionService.getByRoleName({
        roleName: ROLES.PROJECT_ADMIN
      }, done);
    },
    function createProjectUser_step(_permissions, done) {
      permissions = _permissions;

      var projectUser = new ProjectUser();
      projectUser.project = project._id;
      projectUser.user = user._id;
      projectUser.permissions = projectUser.permissions.concat(permissions);

      projectUser.save(done);
    },
    function updateProject_step(_projectUser, numCreated, done) {
      projectUser = _projectUser;

      project.projectUsers.push(projectUser._id);

      project.save(function(err, updatedProject) {
        if (err) return done(err);

        project = updatedProject;

        done();
      });
    },
    function updateUser_step(done) {
      user.projectUsers.push(projectUser._id);

      user.save(function(err, updatedUser) {
        if (err) return done(err);

        user = updatedUser;

        done();
      });
    }
  ], function(err) {
    if (err) return next(err);

    next(null, project);
  });
};

/**
 * @param {object} options
 * @param {string} projectId
 * @param {function} next - callback
 */
ProjectService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

  var query = Project.findOne({
    _id: options.projectId
  });

  return query.exec(function(err, project) {
    if (err) return next(err);
    if (!project) return next(new errors.ObjectNotFoundError('Project not found'));

    next(null, project);
  });
};

/**
 * @param {object} options
 * @param {object} findOptions - hash of mongoose query params
 * @param {array} [populate] - array of keys to populate
 * @param {function} next - callback
 */
ProjectService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var query = Project.find({});

  return query.exec(next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectService();
