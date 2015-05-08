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
var projectUserService = require('modules/project/userService');

//models
var Application = require('modules/application/data/applicationModel');
var Organization = require('modules/organization/data/organizationModel');
var OrganizationUser = require('modules/organization/data/userModel');
var Project = require('modules/project/data/projectModel');
var ProjectUser = require('modules/project/data/userModel');
var Need = require('modules/need/data/needModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var applicationValidator = require('./validators/applicationValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var APPLICATION_STATUSES = require('./constants/applicationStatuses');
var NEED_STATUSES = require('modules/need/constants/needStatuses');
var ROLES = require('modules/role/constants/roleNames');

var UPDATEDABLE_APPLICATION_PROPERTIES = [
  'status'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ApplicationService = function() {
  CommonService.call(this, Application);
};
util.inherits(ApplicationService, CommonService);

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {function} next - callback
 */
ApplicationService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId && !options.userId && !options.organization) return next(new errors.InvalidArgumentError('Organization Id, User Id, or Project Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.needId) return next(new errors.InvalidArgumentError('Need Id is required'));

  var _this = this;
  var organization = null;
  var organizationUsers = null;
  var user = null;
  var project = null;
  var projectUsers = null;

  var need = null;
  var application;

  var createdByUser = null;

  async.waterfall([
    function getEntityByData_step(done) {
      //TODO: only select needed fields in these DB calls
      async.parallel([
        function findEntityById_step(cb) {
          if (options.organizationId) {
            Organization.findById(options.organizationId, function(err, _organization) {
              if (err) return cb(err);

              if (!_organization) return cb(new errors.InvalidArgumentError('No organization exists with the id ' + options.organizationId));

              organization = _organization;

              return cb(null);
            });
          } else if (options.userId) {
            User.findById(options.userId, function(err, _user) {
              if (err) return cb(err);

              if (!_user) return cb(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

              user = _user;

              return cb(null);
            });
          } else {
            Project.findById(options.projectId, function(err, _project) {
              if (err) return cb(err);

              if (!_project) return cb(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

              project = _project;

              return cb(null);
            });
          }
        },
        function getNeedById_step(cb) {
          var conditions = {
            _id: options.needId
          };

          if (options.organizationId) conditions.organization = options.organizationId;
          if (options.userId) conditions.user = options.userId;
          if (options.projectId) conditions.project = options.projectId;

          Need.findOne(conditions, function(err, _need) {
            if (err) return cb(err);

            if (!_need) return cb(new errors.ObjectNotFoundError('Need not found'));
            if (need.status !== NEED_STATUSES.OPEN) return cb(new errors.InvalidArgumentError('Can only apply to needs that are open'));

            need = _need;

            return cb(null);
          });
        },
        function getEntityUsersById_step(cb) {
          if (options.organizationId) {
            OrganizationUser.find({
              organization: options.organizationId
            }, function(err, _organizationUsers) {
              if (err) return cb(err);

              organizationUsers = _organizationUsers;

              return cb(null);
            });
          } else if (options.userId) {
            User.findById(options.userId, function(err, _user) {
              if (err) return cb(err);

              if (!_user) return cb(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

              user = _user;

              return cb(null);
            });
          } else {
            ProjectUser.find({
              project: options.projectId
            }, function(err, _projectUsers) {
              if (err) return cb(err);

              projectUsers = _projectUsers;

              if (_.contains(_.pluck(projectUsers, 'user'), options.createdByUserId)) {
                return cb(new errors.InvalidArgumentError('You are already a member of this project'));
              }

              return cb(null);
            });
          }
        },
        function getApplicationsById_step(cb) {
          var conditions = {
            status: APPLICATION_STATUSES.PENDING,
            createdByUser: options.userId
          };

          if (options.organizationId) conditions.organization = options.organizationId;
          if (options.userId) conditions.user = options.userId;
          if (options.projectId) conditions.project = options.projectId;

          Application.find(conditions, function(err, _applications) {
            if (err) return cb(err);

            if (_applications && _applications.length) {
              return cb(new errors.InvalidArgumentError('You have already applied to this project and cannot apply again'));
            }

            return cb(null);
          });
        }
      ], function(err) {
        if (err) return done(err);

        return done(null);
      });
    },
    function getUserById_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    function createApplication_step(_createdByUser, done) {
      createdByUser = _createdByUser;

      var application = new Application();

      if (organization) application.organization = organization._id;
      if (user) application.user = user._id;
      if (project) application.project = project._id;

      application.createdByUser = createdByUser._id;
      application.createdByUserName = createdByUser.userName;
      application.createdByUserFirstName = createdByUser.firstName;
      application.createdByUserLastName = createdByUser.lastName;
      application.need = need._id;
      application.status = APPLICATION_STATUSES.PENDING;

      application.save(function(err, application) {
        if (err) return done(err);
        return done(null, application);
      });
    },
    function updateEntityWithApplications_step(_application, done) {
      application = _application;

      if (organization) {
        organization.applications.push(application._id);

        organization.save(function(err) {
          if (err) return done(err);
          return done(null);
        });
      } else if (user) {
        user.applications.push(user._id);

        user.save(function(err) {
          if (err) return done(err);
          return done(null);
        });
      } else {
        project.applications.push(project._id);

        project.save(function(err) {
          if (err) return done(err);
          return done(null);
        });
      }
    },
    function updateUserWithApplications_step(done) {
      createdByUser.createdApplications.push(application._id);
      createdByUser.save(function(err) {
        if (err) return done(err);
        return done(null, application);
      });
    }
  ], function(err) {
    if (err) return next(err);

    _this.emit(EVENTS.APPLICATION_CREATED, {
      applicationId: application._id,
      organizationId: organization ? organization._id : null,
      projectId: project ? project._id : null,
      userId: user ? user._id : null,
      createdByUserId: createdByUser._id
    });

    return next(null, application);
  });
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
// ApplicationService.prototype.update = function update(options, next) {
//   if (!options) return next(new errors.InvalidArgumentError('options is required'));
//   if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
//   if (!options.projectApplicationId) return next(new errors.InvalidArgumentError('Project Application Id is required'));
//   if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
//   if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
//   if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
//   if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

//   var _this = this;
//   var project = null;
//   var projectApplication = null;
//   var patches = null;

//   async.waterfall([
//     function findProjectAndProjectApplication(done) {
//       async.parallel([
//         function findProjectById_step(cb) {
//           Project.findById({
//             _id: options.projectId
//           }, function(err, _project) {
//             if (!_project) return done(new errors.ObjectNotFoundError('No project exists with the id ' + options.projectId));

//             project = _project;

//             cb();
//           });
//         },
//         function findProjectApplicationById(cb) {
//           ProjectApplication.findById({
//             _id: options.projectApplicationId,
//             project: options.projectId
//           }, function(err, _projectApplication) {
//             if (!_projectApplication) return done(new errors.ObjectNotFoundError('No project application exists with the id ' + options.projectApplicationId));

//             projectApplication = _projectApplication;

//             cb();
//           });
//         },
//       ], function(err) {
//         if (err) return done(err);
//         return done(err);
//       });
//     },
//     function validateData_step(done) {

//       if (!_.contains(project.projectApplications, options.projectApplicationId)) return done(new errors.InvalidArgumentError(options.projectApplicationId + ' is not an application on this project'));

//       if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
//       else patches = options.patches;

//       patches = patchUtils.stripPatches(UPDATEDABLE_APPLICATION_PROPERTIES, patches);

//       console.log('PROJECT APPLICATION');
//       console.log(projectApplication);

//       console.log('PATCHES:');
//       åå
//       console.log(patches);

//       var projectApplicationClone = _.clone(projectApplication.toJSON());

//       var patchErrors = jsonPatch.validate(patches, projectApplicationClone);

//       if (patchErrors) {
//         return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
//       }

//       try {
//         jsonPatch.apply(projectApplicationClone, patches);
//       } catch (err) {
//         logger.error(err);

//         return done(new errors.InvalidArgumentError('error applying patches'));
//       }

//       console.log('WITH PATCHES APPLIED:');
//       console.log(projectApplicationClone);

//       applicationValidator.validateUpdate(projectApplication, projectApplicationClone, done);
//     },
//     function updateProjectApplication(done) {

//       try {
//         console.log('APPLYING PATCHES:');
//         console.log(patches);

//         jsonPatch.apply(projectApplication, patches);
//       } catch (err) {
//         logger.error(err);

//         return done(new errors.InvalidArgumentError('error applying patches'));
//       }

//       console.log('AFTER PATCHES:');
//       console.log(projectApplication);

//       projectApplication.save(done);
//     },
//     function addProjectUser_step(updateProjectApplication, numUpdated, done) {
//       projectApplication = updateProjectApplication;

//       console.log('\n\n GOT HERE \n\n');
//       console.log(options);

//       if (patchUtils.patchesContainsWithValue(patches, '/status', APPLICATION_STATUSES.APPROVED)) {
//         console.log('GOT HERE');

//         projectUserService.create({
//           projectId: projectApplication.project,
//           userId: projectApplication.user,
//           role: ROLES.PROJECT_MEMBER
//         }, done);;
//       } else {
//         done();
//       }
//     }
//   ], function finish(err) {
//     if (err) return next(err);

//     if (options.status === APPLICATION_STATUSES.APPROVED) {
//       _this.emit(EVENTS.PROJECT_APPLICATION_APPROVED, {
//         projectId: project._id,
//         userId: user._id,
//         projectApplicationId: projectApplication._id
//       });
//     } else if (options.status === APPLICATION_STATUSES.DECLINED) {
//       _this.emit(EVENTS.PROJECT_APPLICATION_DECLINED, {
//         projectId: project._id,
//         userId: user._id,
//         projectApplicationId: projectApplication._id
//       });
//     }

//     return next(null, projectApplication);
//   });
// };

/**
 * @param {object} options
 * @param {string} options.applicationId
 * @param {function} next - callback
 */
ApplicationService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.applicationId) return next(new errors.InvalidArgumentError('Application Id is required'));

  var _this = this;

  var query = Application.findOne({
    _id: options.applicationId
  });

  query.exec(function(err, application) {
    if (err) return next(err);
    if (!application) return next(new errors.ObjectNotFoundError('Application not found'));

    return next(null, application);
  });
};

/**
 * @param {object} options
 * @param {string} options.organizationId
 * @param {function} next - callback
 */
ApplicationService.prototype.getByOrganizationId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));

  var _this = this;

  var query = Application.find({
    organization: options.organizationId
  });

  query.exec(function(err, applications) {
    if (err) return next(err);

    return next(null, applications);
  });
};

/**
 * @param {object} options
 * @param {string} options.userId
 * @param {function} next - callback
 */
ApplicationService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  var query = Application.find({
    user: options.userId
  });

  query.exec(function(err, applications) {
    if (err) return next(err);

    return next(null, applications);
  });
};

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {function} next - callback
 */
ApplicationService.prototype.getByProjectId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

  var _this = this;

  var query = Application.find({
    project: options.projectId
  });

  query.exec(function(err, applications) {
    if (err) return next(err);

    return next(null, applications);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ApplicationService();
