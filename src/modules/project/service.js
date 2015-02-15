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
var User = require('modules/user/data/model');
var Project = require('./data/model');

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

  next();
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
