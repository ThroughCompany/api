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
var projectService = require('modules/project');

//models
var Organization = require('modules/organization/data/organizationModel');
var OrganizationProject = require('modules/organization/data/projectModel');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Constructor
 * ========================================================================= */
var OrganizationProjectService = function() {
  CommonService.call(this, OrganizationProject);
};
util.inherits(OrganizationProjectService, CommonService);

// OrganizationProjectService.prototype.create = function(options, next) {
//   if (!options) return next(new errors.InvalidArgumentError('options is required'));
//   if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));

//   var _this = this;
//   var organization = null;
//   var project = null;
//   var organizationProject = null;

//   async.waterfall([
//     function findOrganizationBy_step(done) {
//       Organization.findById(options.organizationId, done);
//     },
//     function createProject_step(_organization, done) {
//       if (!_organization) return done(new errors.ObjectNotFoundError('Organization not found'));

//       organization = _organization;

//       projectService.create(options, done);
//     },
//     function createOrganizationProject_step(_project, done) {
//       project = _project;

//       organizationProject = new OrganizationProject();
//       organizationProject.project = project._id;
//       organizationProject.organization = organization._id;
//       organizationProject.created = new Date();
//       organizationProject.modified = organizationProject.created;

//       organizationProject.save(function(err, updatedOrganizationProject) {
//         if (err) return done(err);

//         organizationProject = updatedOrganizationProject;

//         return done(null);
//       });
//     },
//     function updateOrganizationWithProject_step(done) {
//       organization.organizationProjects.push(organizationProject._id);

//       organization.save(function(err, updatedOrganization) {
//         if (err) return done(err);

//         organization = updatedOrganization;

//         return done(null);
//       });
//     },
//     function updateProjectWithOrganization_step(done) {
//       project.organizationProject = organizationProject._id;

//       project.save(function(err, updatedProject) {
//         if (err) return done(err);

//         project = updatedProject;

//         return done(null);
//       });
//     }
//   ], function(err) {
//     if (err) return next(err);

//     return next(null, organizationProject);
//   });
// };

/**
 * @param {object} options
 * @param {object} options.projectId
 * @param {function} next - callback
 */
// OrganizationProjectService.prototype.getByProjectId = function(options, next) {
//   if (!options) return next(new errors.InvalidArgumentError('options is required'));
//   if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

//   var _this = this;

//   var query = OrganizationProject.find({
//     project: options.projectId
//   });

//   query.exec(next);
// };

/**
 * @param {object} options
 * @param {object} options.organizationId
 * @param {function} next - callback
 */
OrganizationProjectService.prototype.getByOrganizationId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));

  var _this = this;

  var query = OrganizationProject.find({
    organization: options.organizationId
  });

  query.exec(next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new OrganizationProjectService();
