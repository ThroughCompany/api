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
var ProjectNeed = require('modules/project/data/needModel');
var ProjectUser = require('modules/project/data/userModel');
var Project = require('modules/project/data/projectModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var needValidator = require('./validators/needValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var NEED_STATUSES = require('./constants/needStatuses');

var UPDATEDABLE_PROJECT_NEED_PROPERTIES = [
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
var ProjectNeedService = function() {
  CommonService.call(this, ProjectNeed);
};
util.inherits(ProjectNeedService, CommonService);

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
ProjectNeedService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));
  if (!options.description) return next(new errors.InvalidArgumentError('Description is required'));
  if (!options.skills || !_.isArray(options.skills)) return next(new errors.InvalidArgumentError('Skills is required'));
  options.skils = utils.arrayClean(options.skills);

  var _this = this;
  var project = null;
  var skillIds = [];
  var projectNeed = null;

  async.waterfall([
      function findProjectById_step(done) {
        Project.findById(options.projectId, done);
      },
      function validateData_step(_project, done) {
        if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

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
      function createProjectNeed_step(done) {
        projectNeed = new ProjectNeed();
        projectNeed.project = project._id;
        projectNeed.name = options.name;
        projectNeed.skills = skillIds;
        projectNeed.status = NEED_STATUSES.OPEN;
        projectNeed.description = options.description;
        if (options.timeCommitment) {
          projectNeed.timeCommitment.hoursPerWeek = options.timeCommitment.hoursPerWeek;
          projectNeed.timeCommitment.totalHours = options.timeCommitment.totalHours;
        }
        if (options.duration) {
          projectNeed.duration.startDate = options.duration.startDate;
          projectNeed.duration.endDate = options.duration.endDate;
        }
        projectNeed.locationSpecific = options.locationSpecific !== null && options.locationSpecific !== undefined ? options.locationSpecific : false;

        projectNeed.save(function(err, newProjectNeed) {
          if (err) return done(err);

          projectNeed = newProjectNeed;

          return done(null, newProjectNeed);
        });
      },
      function updateProjectWithNeed_step(projectNeed, done) {
        project.projectNeeds.push(projectNeed._id);
        project.openProjectNeedsCount++;

        project.save(done);
      }
    ],
    function finish(err, project) {
      if (err) return next(err);

      return next(null, projectNeed);
    });
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
ProjectNeedService.prototype.update = function update(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.projectNeedId) return next(new errors.InvalidArgumentError('Project Need Id is required'));
  if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
  if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
  if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
  if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

  //TODO: if a skill is changed, need to emit SKILL_USED_BY_PROJECT event

  var _this = this;
  var project = null;
  var projectNeed = null;
  var patches = null;

  async.waterfall([
    function findProjectAndProjectNeed(done) {
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
        function findProjectNeedById(cb) {
          ProjectNeed.findById({
            _id: options.projectNeedId
          }, function(err, _projectNeed) {
            if (!_projectNeed) return done(new errors.ObjectNotFoundError('No project need exists with the id ' + options.projectNeedId));

            projectNeed = _projectNeed;

            cb();
          });
        },
      ], function(err) {
        if (err) return done(err);
        return done(err);
      });
    },
    function validateData_step(done) {

      if (!_.contains(project.projectNeeds, options.projectNeedId)) return done(new errors.InvalidArgumentError(options.projectNeedId + ' is not a need on this project'));

      if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
      else patches = options.patches;

      patches = patchUtils.stripPatches(UPDATEDABLE_PROJECT_NEED_PROPERTIES, patches);

      console.log('PROJECT NEED');
      console.log(projectNeed);

      console.log('PATCHES:');
      console.log(patches);

      var projectNeedClone = _.clone(projectNeed.toJSON());

      var patchErrors = jsonPatch.validate(patches, projectNeedClone);

      if (patchErrors) {
        return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
      }

      try {
        jsonPatch.apply(projectNeedClone, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      console.log('WITH PATCHES APPLIED:');
      console.log(projectNeedClone);

      needValidator.validateUpdate(projectNeed, projectNeedClone, done);
    },
    function updateProject(done) {

      try {
        console.log('APPLYING PATCHES:');
        console.log(patches);

        jsonPatch.apply(projectNeed, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      console.log('AFTER PATCHES:');
      console.log(projectNeed);

      projectNeed.save(done);
    }
  ], function finish(err, projectNeed) {
    return next(err, projectNeed); //don't remove, callback needed because mongoose save returns 3rd arg
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectNeedService();
