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

//var needValidator = require('./validators/applicationValidator');

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

  if (options.employmentType && !_.contains(_.values(NEED_EMPLOYMENT_TYPES), options.employmentType)) return next(new errors.InvalidArgumentError(options.employmentType + ' is not a valid employment type'));
  // if (options.duration) {
  //   if (!options.duration.min) return next(new errors.InvalidArgumentError('Duration Min is required'));
  //   if (!options.duration.minAmount) return next(new errors.InvalidArgumentError('Duration Min Amount is required'));
  //   if (!_.contains(_.values(DURATION_AMOUNTS), options.duration.minAmount)) return next(new errors.InvalidArgumentError(options.duration.minAmount + ' is not a valid duration min amount'));
  //   if (options.duration.maxAmount && !_.contains(_.values(DURATION_AMOUNTS), options.duration.maxAmount)) return next(new errors.InvalidArgumentError(options.duration.maxAmount + ' is not a valid duration max amount'));

  //   //TODO: validate that min is not greater than max
  //   //TODO: validate that minAmount type is not greater than maxAmount type (ie minAmount = days && maxAmount = hours)
  // }

  async.waterfall([
      function findProjectById_step(done) {
        Project.findById(options.projectId, done);
      },
      function findNeed_step(_project, done) {
        if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

        project = _project;

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
        projectNeed.employmentType = options.employmentType || NEED_EMPLOYMENT_TYPES.VOLUNTEER;

        // if (options.duration) {
        //   projectNeed.duration = {
        //     min: options.duration.min,
        //     minAmount: options.minAmount,
        //     max: options.max,
        //     maxAmount: options.maxAmount
        //   };
        // }

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
