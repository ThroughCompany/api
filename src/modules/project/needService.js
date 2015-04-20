/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

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
var utils = require('utils/utils');

var needValidator = require('./validators/needValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var NEED_EMPLOYMENT_TYPES = require('./constants/needEmploymentTypes');
var DURATION_AMOUNTS = require('./constants/durationAmounts');

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
        //projectNeed.employmentType = options.employmentType || NEED_EMPLOYMENT_TYPES.VOLUNTEER;

        projectNeed.save(function(err, newProjectNeed) {
          if (err) return done(err);

          projectNeed = newProjectNeed;

          return done(null, newProjectNeed);
        });
      },
      function updateProjectWithNeed_step(projectNeed, done) {
        project.projectNeeds.push(projectNeed._id);

        project.save(done);
      }
    ],
    function finish(err, project) {
      if (err) return next(err);

      return next(null, projectNeed);
    });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectNeedService();
