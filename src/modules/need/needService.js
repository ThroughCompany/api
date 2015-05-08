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
var skillService = require('modules/skill');
var userService = require('modules/user');

//models
var Need = require('modules/need/data/needModel');
var Organization = require('modules/organization/data/organizationModel');
var User = require('modules/user/data/model');
var ProjectUser = require('modules/project/data/userModel');
var Project = require('modules/project/data/projectModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var needPopulateService = require('./populate/service');

var needValidator = require('./validators/needValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var NEED_STATUSES = require('./constants/needStatuses');
var NEED_TYPES = require('./constants/needTypes');

var UPDATEDABLE_NEED_PROPERTIES = [
  'name',
  'description',
  'duration',
  'timeCommitment',
  'locationSpecific',
  'skills'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
var NeedService = function() {
  CommonService.call(this, Need);
};
util.inherits(NeedService, CommonService);

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {string} options.name
 * @param {string} options.description
 * @param {array} options.skills
 * @param {object} options.timeCommitment
 * @param {int} options.timeCommitment.hoursPerWeek
 * @param {int} options.timeCommitment.totalHours
 * @param {object} options.duration
 * @param {date} options.timeCommitment.startDate
 * @param {date} options.timeCommitment.endDate
 * @param {function} next - callback
 */
NeedService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId && !options.userId && !options.organization) return next(new errors.InvalidArgumentError('Organization Id, User Id, or Project Id is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));
  if (!options.description) return next(new errors.InvalidArgumentError('Description is required'));
  if (!options.skills || !_.isArray(options.skills)) return next(new errors.InvalidArgumentError('Skills is required'));
  options.skils = utils.arrayClean(options.skills);

  var _this = this;
  var organization = null;
  var user = null;
  var project = null;
  var skillIds = [];
  var need = null;

  async.waterfall([
      function findEntitiyById_step(done) {
        if (options.organizationId) {
          Organization.findById(options.organizationId, function(err, _organization) {
            if (err) return done(err);

            if (!_organization) return done(new errors.InvalidArgumentError('No organization exists with the id ' + options.organizationId));

            organization = _organization;

            return done(null);
          });
        } else if (options.userId) {
          User.findById(options.userId, function(err, _user) {
            if (err) return done(err);

            if (!_user) return done(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

            user = _user;

            return done(null);
          });
        } else {
          Project.findById(options.projectId, function(err, _project) {
            if (err) return done(err);

            if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

            project = _project;

            return done(null);
          });
        }
      },
      function validateData_step(done) {
        project = _project;

        needValidator.validateCreate(options, done);
      },
      function findOrCreateSkills_step(done) {
        async.each(options.skills, function(skill, cb) {
          skillService.getOrCreateByName({
            name: skill
          }, function(err, newSkill) {
            if (err) return done(err);

            skillIds.push(newSkill._id);

            return cb(null);
          });
        }, done);
      },
      function createNeed_step(done) {
        need = new Need();

        if (organization) {
          need.type = NEED_TYPES.ORGANIZATION;
          need.organization = organization._id
        };
        if (user) {
          need.type = NEED_TYPES.USER;
          need.user = user._id;
        }
        if (project) {
          need.type = NEED_TYPES.PROJECT;
          need.project = project._id;
        }

        need.name = options.name;
        need.skills = skillIds;
        need.status = NEED_STATUSES.OPEN;
        need.description = options.description;
        if (options.timeCommitment) {
          need.timeCommitment.hoursPerWeek = options.timeCommitment.hoursPerWeek;
          need.timeCommitment.totalHours = options.timeCommitment.totalHours;
        }
        if (options.duration) {
          need.duration.startDate = options.duration.startDate;
          need.duration.endDate = options.duration.endDate;
        }
        need.locationSpecific = options.locationSpecific !== null && options.locationSpecific !== undefined ? options.locationSpecific : false;

        need.save(function(err, newNeed) {
          if (err) return done(err);

          need = newNeed;

          return done(null, need);
        });
      },
      function updateEntityWithNeed_step(need, done) {
        if (organization) {
          organization.needs.push(need._id);
          organization.openNeedsCount++;

          organization.save(function(err, _updatedOrganization) {
            if (err) return done(err);

            organization = _updatedOrganization;

            return done(null);
          });
        } else if (user) {
          user.needs.push(need._id);
          user.openNeedsCount++;

          user.save(function(err, _updatedUser) {
            if (err) return done(err);

            user = _updatedUser;

            return done(null);
          });
        } else {
          project.needs.push(need._id);
          project.openNeedsCount++;

          project.save(function(err, _updatedProject) {
            if (err) return done(err);

            project = _updatedProject;

            return done(null);
          });
        }
      }
    ],
    function finish(err) {
      if (err) return next(err);

      var skills;
      var event;

      if (organization) skills = organization.skills;
      if (user) skills = user.skills;
      if (project) skills = project.skills;

      _.each(skills, function(skill) {
        _this.emit(EVENTS.SKILL_USED, {
          skillId: skill,
          type: need.type
        });
      });

      return next(null, need);
    });
};

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {string} options.fields
 * @param {function} next - callback
 */
NeedService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.needId) return next(new errors.InvalidArgumentError('Need Id is required'));

  var _this = this;
  var fields = null;
  var expands = null;

  async.waterfall([
    function parseFieldsAndExpands(done) {
      if (options.fields) {
        partialResponseParser.parse({
          fields: options.fields
        }, function(err, results) {
          if (err) return done(err);

          fields = results.fields;
          expands = results.expands;

          return done();
        });
      } else {
        return done(null);
      }
    },
    function getProjectById_step(done) {
      var query = Need.findOne({
        _id: options.needId
      });

      if (fields) {
        query.select(fields.select);
      }

      query.exec(function(err, need) {
        if (err) return done(err);
        if (!need) return done(new errors.ObjectNotFoundError('Need not found'));

        return done(null, need);
      });
    },
    function populate_step(need, done) {
      if (!expands) return done(null, need);

      needPopulateService.populate({
        docs: need,
        expands: expands
      }, done);
    }
  ], next);
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
NeedService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (options.status && !_.contains(_.values(NEED_STATUSES), options.status)) return next(new errors.InvalidArgumentError(options.status + ' is not a valid need status'));
  if (options.skills && !_.isString(options.skills)) return next(new errors.InvalidArgumentError('Skills must be a string'));

  var conditions = {};
  var steps = [];
  var needs = null;

  if (options.skills) {
    options.skills = utils.arrayClean(options.skills.split(','));

    steps.push(function findNeeds_step(done) {
      Skill.find({
        name: {
          $in: options.skills
        }
      }, function(err, skills) {
        if (err) return done(err);

        skills = skills;

        return done(null);
      });
    });
  }

  steps.push(function findProjects_step(done) {
    if (options.status) {
      conditions.status = options.status;
    } else {
      conditions.status = PROJECT_STATUSES.OPEN;
    }

    if (options.skills) {
      conditions.skills = _.pluck(skills, '_id')
    }

    var query = Need.find(conditions);

    return query.exec(function(err, _needs) {
      if (err) return next(err);

      needs = _needs;

      return done(err);
    });
  });

  async.series(steps, function(err) {
    if (err) return next(err);

    return next(null, needs);
  });
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
// NeedService.prototype.update = function update(options, next) {
//   if (!options) return next(new errors.InvalidArgumentError('options is required'));
//   if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
//   if (!options.projectNeedId) return next(new errors.InvalidArgumentError('Project Need Id is required'));
//   if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
//   if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
//   if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
//   if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

//   //TODO: if a skill is changed, need to emit SKILL_USED_BY_PROJECT event

//   var _this = this;
//   var project = null;
//   var projectNeed = null;
//   var patches = null;

//   async.waterfall([
//     function findProjectAndProjectNeed(done) {
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
//         function findProjectNeedById(cb) {
//           ProjectNeed.findById({
//             _id: options.projectNeedId,
//             project: options.projectId
//           }, function(err, _projectNeed) {
//             if (!_projectNeed) return done(new errors.ObjectNotFoundError('No project need exists with the id ' + options.projectNeedId));

//             projectNeed = _projectNeed;

//             cb();
//           });
//         },
//       ], function(err) {
//         if (err) return done(err);
//         return done(err);
//       });
//     },
//     function validateData_step(done) {

//       if (!_.contains(project.projectNeeds, options.projectNeedId)) return done(new errors.InvalidArgumentError(options.projectNeedId + ' is not a need on this project'));

//       if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
//       else patches = options.patches;

//       patches = patchUtils.stripPatches(UPDATEDABLE_NEED_PROPERTIES, patches);

//       console.log('PROJECT NEED');
//       console.log(projectNeed);

//       console.log('PATCHES:');
//       console.log(patches);

//       var projectNeedClone = _.clone(projectNeed.toJSON());

//       var patchErrors = jsonPatch.validate(patches, projectNeedClone);

//       if (patchErrors) {
//         return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
//       }

//       try {
//         jsonPatch.apply(projectNeedClone, patches);
//       } catch (err) {
//         logger.error(err);

//         return done(new errors.InvalidArgumentError('error applying patches'));
//       }

//       console.log('WITH PATCHES APPLIED:');
//       console.log(projectNeedClone);

//       needValidator.validateUpdate(projectNeed, projectNeedClone, done);
//     },
//     function updateProject(done) {

//       try {
//         console.log('APPLYING PATCHES:');
//         console.log(patches);

//         jsonPatch.apply(projectNeed, patches);
//       } catch (err) {
//         logger.error(err);

//         return done(new errors.InvalidArgumentError('error applying patches'));
//       }

//       console.log('AFTER PATCHES:');
//       console.log(projectNeed);

//       projectNeed.save(done);
//     }
//   ], function finish(err, projectNeed) {
//     return next(err, projectNeed); //don't remove, callback needed because mongoose save returns 3rd arg
//   });
// };

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new NeedService();
