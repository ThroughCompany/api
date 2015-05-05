/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var Skill = require('./data/model');
var ProjectNeed = require('modules/project/data/needModel');

/* =========================================================================
 * Constants
 * ========================================================================= */
var TAKE = 50;
var MAX_TAKE = 200;

/* =========================================================================
 * Constructor
 * ========================================================================= */
var SkillsService = function() {
  CommonService.call(this, Skill);
};
util.inherits(SkillsService, CommonService);

/**
 * @param {object} options
 * @param {string} name
 * @param {function} next - callback
 */
SkillsService.prototype.getByName = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var query = Skill.findOne({
    name: options.name
  });

  query.exec(function(err, skill) {
    if (err) return next(err);
    if (!skill) return next(new errors.ObjectNotFoundError('Skill not found'));

    next(null, skill);
  });
};

/**
 * @param {object} options
 * @param {object} [options.name]
 * @param {object} [options.select]
 * @param {object} [options.take]
 * @param {function} next - callback
 */
SkillsService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var steps = [];
  var skills = null;
  var projectNeed = null;

  console.log(options);

  if (options.projectNeedId) {
    steps.push(function getByProjectNeed_step(done) {
      ProjectNeed.findById(options.projectNeedId, function(err, _projectNeed) {
        if (err) return next(err);
        if (!_projectNeed) return next(new errors.ObjectNotFoundError('Project Need not found'));

        projectNeed = _projectNeed;

        return done(null);
      });
    });
  }

  steps.push(function findSkills_step(done) {
    var conditions = {};

    if (options.name) {
      var nameRegex = new RegExp(options.name, 'ig');

      conditions.name = {
        $regex: nameRegex
      };
    }

    if (projectNeed) {
      var skillIds = projectNeed.skills;

      conditions._id = {
        $in: skillIds
      };
    }

    var query = Skill.find(conditions);

    if (options.select) {
      query.select(options.select);
    }

    query.limit(options.take && options.take <= MAX_TAKE ? options.take : TAKE);

    query.sort('-projectUseCount');

    query.exec(function(err, _skills) {
      if (err) return done(err);

      skills = _skills;

      done();
    });
  });

  async.series(steps, function(err) {
    if (err) return next(err);

    return next(null, skills);
  });
};

/**
 * @param {object} options
 * @param {object} [options.name]
 * @param {object} [options.select]
 * @param {object} [options.take]
 * @param {function} next - callback
 */
SkillsService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.skillId) return next(new errors.InvalidArgumentError('Skill Id is required'));

  var query = Skill.findOne({
    _id: options.skillId
  });

  query.exec(function(err, skill) {
    if (err) return next(err);
    if (!skill) return next(new errors.ObjectNotFoundError('Skill not found'));

    next(null, skill);
  });
};

/**
 * @param {object} options
 * @param {string} options.name
 * @param {function} next - callback
 */
SkillsService.prototype.getOrCreateByName = function getOrCreateByName(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;

  var slug = generateSlug(options.name);

  async.waterfall([
    function verifyTagIsUnique_step(done) {
      var query = Skill.findOne({
        slug: slug
      });

      query.exec(function(err, skill) {
        if (err) return done(err);

        done(null, skill);
      });
    },
    function createSkill_step(skill, done) {
      if (skill) return done(null, skill);

      var skill = new Skill();
      skill.name = options.name;
      skill.slug = slug;

      skill.save(done);
    }
  ], function(err, skill) {
    next(err, skill);
  });
};

/**
 * @param {object} options
 * @param {string} options.name
 * @param {function} next - callback
 */
SkillsService.prototype.updateSkillUserUseCount = function updateSkillUserUseCount(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.skillId) return next(new errors.InvalidArgumentError('Skill Id is required'));

  var _this = this;

  async.waterfall([
    function findTagById_step(done) {
      _this.getById({
        skillId: options.skillId
      }, done);
    },
    function updateSkill_step(skill, done) {
      skill.userUseCount = skill.userUseCount + 1;
      skill.save(done);
    }
  ], next);
};

/**
 * @param {object} options
 * @param {string} options.name
 * @param {function} next - callback
 */
SkillsService.prototype.updateSkillProjectUseCount = function updateSkillProjectUseCount(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.skillId) return next(new errors.InvalidArgumentError('Skill Id is required'));

  var _this = this;

  async.waterfall([
    function findTagById_step(done) {
      _this.getById({
        skillId: options.skillId
      }, done);
    },
    function updateSkill_step(skill, done) {
      skill.projectUseCount = skill.projectUseCount + 1;
      skill.save(done);
    }
  ], next);
};
/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function generateSlug(name) {
  return name.trim().replace(/\s/gi, '-').replace(/('|\.)/gi, '').toLowerCase();
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new SkillsService();
