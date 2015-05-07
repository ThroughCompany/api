/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var jsonPatch = require('fast-json-patch');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var userService = require('modules/user');
var projectUserService = require('./userService');

//models
var ProjectApplication = require('modules/project/data/applicationModel');
var ProjectUser = require('modules/project/data/userModel');
var Project = require('modules/project/data/projectModel');
var ProjectNeed = require('modules/project/data/needModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var applicationValidator = require('./validators/applicationValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var APPLICATION_STATUSES = require('./constants/applicationStatuses');
var NEED_STATUSES = require('./constants/needStatuses');
var ROLES = require('modules/role/constants/roleNames');

var UPDATEDABLE_PROJECT_APPLICATION_PROPERTIES = [
  'status'
];

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
  if (!options.needId) return next(new errors.InvalidArgumentError('Need Id is required'));

  var _this = this;
  var project = null;
  var projectNeed = null;
  var projectUsers = null;
  var projectApplications = null;

  var user = null;
  var projectApplication = null;

  async.waterfall([
    function getProjectByData_step(done) {
      //TODO: only select needed fields in these DB calls
      async.parallel([
        function getProjectById_step(cb) {
          Project.findById(options.projectId, cb);
        },
        function getProjectNeedById_step(cb) {
          ProjectNeed.findOne({
            _id: options.needId,
            project: options.projectId
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

        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        projectNeed = results[1];

        if (!projectNeed) return done(new errors.ObjectNotFoundError('Project Need not found'));
        if (projectNeed.status !== NEED_STATUSES.OPEN) return done(new errors.InvalidArgumentError('Can only apply to project needs that are open'));

        projectUsers = results[2];
        projectApplications = results[3];

        return done(null);
      });
    },
    function getUserById_step(done) {
      if (_.contains(_.pluck(projectUsers, 'user'), options.userId)) {
        return done(new errors.InvalidArgumentError('You are already a member of this project'));
      }

      //checks if the user has a PENDING application already
      var userProjectApplications = _.filter(projectApplications, function(projectApplication) {
        return projectApplication.user === options.userId && projectApplication.status === APPLICATION_STATUSES.PENDING;
      });

      if (userProjectApplications && userProjectApplications.length) {
        return done(new errors.InvalidArgumentError('You have already applied to this project and cannot apply again'));
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
      projectApplication.userName = user.userName;
      projectApplication.userFirstName = user.firstName;
      projectApplication.userLastName = user.lastName;
      projectApplication.projectNeed = projectNeed._id;
      projectApplication.projectName = project.name;
      projectApplication.status = APPLICATION_STATUSES.PENDING;

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
  ], function(err) {
    if (err) return next(err);

    _this.emit(EVENTS.PROJECT_APPLICATION_CREATED, {
      projectApplicationId: projectApplication._id,
      projectId: projectApplication.project,
      userId: projectApplication.user
    });

    return next(null, projectApplication);
  });
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
ProjectApplicationService.prototype.update = function update(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));
  if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
  if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
  if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
  if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

  var _this = this;
  var project = null;
  var projectApplication = null;
  var patches = null;

  async.waterfall([
    function findProjectAndProjectApplication(done) {
      async.parallel([
        function findProjectById_step(cb) {
          Project.findById({
            _id: options.projectId
          }, function(err, _project) {
            if (!_project) return done(new errors.ObjectNotFoundError('No project exists with the id ' + options.projectId));

            project = _project;

            cb();
          });
        },
        function findProjectApplicationById(cb) {
          ProjectApplication.findById({
            _id: options.projectApplicationId,
            project: options.projectId
          }, function(err, _projectApplication) {
            if (!_projectApplication) return done(new errors.ObjectNotFoundError('No project application exists with the id ' + options.projectApplicationId));

            projectApplication = _projectApplication;

            cb();
          });
        },
      ], function(err) {
        if (err) return done(err);
        return done(err);
      });
    },
    function validateData_step(done) {

      if (!_.contains(project.projectApplications, options.projectApplicationId)) return done(new errors.InvalidArgumentError(options.projectApplicationId + ' is not an application on this project'));

      if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
      else patches = options.patches;

      patches = patchUtils.stripPatches(UPDATEDABLE_PROJECT_APPLICATION_PROPERTIES, patches);

      console.log('PROJECT APPLICATION');
      console.log(projectApplication);

      console.log('PATCHES:');
      console.log(patches);

      var projectApplicationClone = _.clone(projectApplication.toJSON());

      var patchErrors = jsonPatch.validate(patches, projectApplicationClone);

      if (patchErrors) {
        return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
      }

      try {
        jsonPatch.apply(projectApplicationClone, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      console.log('WITH PATCHES APPLIED:');
      console.log(projectApplicationClone);

      applicationValidator.validateUpdate(projectApplication, projectApplicationClone, done);
    },
    function updateProjectApplication(done) {

      try {
        console.log('APPLYING PATCHES:');
        console.log(patches);

        jsonPatch.apply(projectApplication, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      console.log('AFTER PATCHES:');
      console.log(projectApplication);

      projectApplication.save(done);
    },
    function addProjectUser_step(updateProjectApplication, numUpdated, done) {
      projectApplication = updateProjectApplication;

      console.log('\n\n GOT HERE \n\n');
      console.log(options);

      if (patchUtils.patchesContainsWithValue(patches, '/status', APPLICATION_STATUSES.APPROVED)) {
        console.log('GOT HERE');

        projectUserService.create({
          projectId: projectApplication.project,
          userId: projectApplication.user,
          role: ROLES.PROJECT_MEMBER
        }, done);;
      } else {
        done();
      }
    }
  ], function finish(err) {
    if (err) return next(err);

    if (options.status === APPLICATION_STATUSES.APPROVED) {
      _this.emit(EVENTS.PROJECT_APPLICATION_APPROVED, {
        projectId: project._id,
        userId: user._id,
        projectApplicationId: projectApplication._id
      });
    } else if (options.status === APPLICATION_STATUSES.DECLINED) {
      _this.emit(EVENTS.PROJECT_APPLICATION_DECLINED, {
        projectId: project._id,
        userId: user._id,
        projectApplicationId: projectApplication._id
      });
    }

    return next(null, projectApplication);
  });
};

/**
 * @param {object} options
 * @param {string} options.projectApplicationId
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

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {function} next - callback
 */
ProjectApplicationService.prototype.getByProjectId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

  var _this = this;

  var query = ProjectApplication.find({
    project: options.projectId
  });

  query.exec(function(err, projectApplications) {
    if (err) return next(err);

    return next(null, projectApplications);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectApplicationService();
