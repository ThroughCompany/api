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
var Project = require('modules/project/data/projectModel');
var ProjectUser = require('modules/project/data/userModel');

/* =========================================================================
 * Constants
 * ========================================================================= */
var ROLES = require('modules/role/constants/roleNames');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ProjectUserService = function() {
  CommonService.call(this, ProjectUser);
};
util.inherits(ProjectUserService, CommonService);

/**
 * @param {object} options
 * @param {object} [options.projectId]
 * @param {object} [project]
 * @param {object} [options.userId]
 * @param {object} [user]
 * @param {function} next - callback
 */
ProjectUserService.prototype.create = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId && !options.project) return next(new errors.InvalidArgumentError('Project Id or Project is required'));
  if (!options.userId && !options.user) return next(new errors.InvalidArgumentError('User Id or User is required'));

  if (options.role && !_.contains(_.values(ROLES), options.role)) return next(new errors.InvalidArgumentError(options.role + ' is not a valid role'));

  var _this = this;
  var project = null;
  var projectUsers = null;
  var user = null;

  async.waterfall([
    function findProjectandUsers_step(done) {
      async.parallel([
        function findProjectById_step(cb) {
          if (options.project) {
            //TODO: should we verify this is an actual Mongoose object somehow? could check __t prop === 'Project'
            return cb(null, options.project);
          } else {
            Project.findById(options.projectId, cb);
          }
        },
        function findProjectUsersByProjectId_step(cb) {
          ProjectUser.find({
            project: options.project ? options.project._id : options.projectId
          }, cb);
        },
        function findUserById_step(cb) {
          if (options.user) {
            return cb(null, options.user);
          } else {
            User.findById(options.userId, cb);
          }
        }
      ], function(err, results) {
        if (err) return done(err);

        project = results[0];
        projectUsers = results[1];
        user = results[2];

        var projectUserIds = _.pluck(projectUsers, 'user');

        if (_.contains(projectUserIds, options.user ? options.user._id : options.userId)) return done(new errors.InvalidArgumentError('User is already a member of this project'));

        return done(null);
      });
    },
    function getProjectUserPermissions_step(done) {
      permissionService.getByRoleName({
        roleName: options.role || ROLES.PROJECT_MEMBER
      }, done);
    },
    function createProjectUser_step(_permissions, done) {
      permissions = _permissions;

      projectUser = new ProjectUser();
      projectUser.project = project._id;
      projectUser.user = user._id;
      //projectUser.email = user.email;
      projectUser.permissions = projectUser.permissions.concat(permissions);

      projectUser.save(function(err, _projectUser) {
        if (err) return done(err);

        projectUser = _projectUser;

        return done(null);
      });
    },
    function updateProject_step(done) {
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

    return next(null, projectUser);
  });
};

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
ProjectUserService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  var query = ProjectUser.find({
    user: options.userId
  });

  query.exec(next);
};

ProjectUserService.prototype.getByProjectId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

  var _this = this;

  var query = ProjectUser.find({
    project: options.projectId
  });

  query.exec(next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectUserService();
