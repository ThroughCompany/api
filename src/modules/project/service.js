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

var validator = require('./validator');

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

  var _this = this;
  var user = null;
  var project = null;
  var projectUser = null;
  var permissions = null;

  async.waterfall([
    function validateData_step(done) {
      validator.validateCreate(options, done);
    },
    function findUserByUserId_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    function createProject_step(_user, done) {
      user = _user;

      var project = new Project();
      project.name = options.name;
      project.shortDescription = options.shortDescription;
      project.description = options.description;

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
 * @param {string} userId
 * @param {object} updates
 * @param {function} next - callback
 */
ProjectService.prototype.update = function(options, next) {
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.updates) return next(new errors.InvalidArgumentError('Updates is required'));

  var _this = this;
  var updates = options.updates;
  var project = null;

  async.waterfall([
    function findUserById(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function validateData_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;

      validator.validateUpdate(project, options, done);
    },
    function updateProject(done) {
      project.name = updates.name ? updates.name : project.name;
      project.shortDescription = updates.shortDescription ? updates.shortDescription : project.shortDescription;
      project.description = updates.description ? updates.description : project.description;

      project.save(done);
    }
  ], function finish(err, results) {
    return next(err, results);
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
 * @param {function} next - callback
 */
ProjectService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var query = Project.find({});

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
ProjectService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  async.waterfall([
    function findProjectUsersByUserId_step(done) {
      var query = ProjectUser.find({
        user: options.userId
      });

      query.exec(done);
    },
    function findProjectsById_step(projectUsers, done) {
      var projectIds = _.pluck(projectUsers, 'project');

      var query = Project.find({
        _id: {
          $in: projectIds
        }
      });

      query.exec(done);
    }
  ], next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectService();
