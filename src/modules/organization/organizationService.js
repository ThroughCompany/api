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
var permissionService = require('modules/permission');
var userService = require('modules/user');

//models
var Organization = require('modules/organization/data/organizationModel');
var OrganizationUser = require('modules/organization/data/userModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var organizationValidator = require('./validators/organizationValidator');

var partialResponseParser = require('modules/partialResponse/parser');

/* =========================================================================
 * Constants
 * ========================================================================= */
//var EVENTS = require('./constants/events');
var ROLES = require('modules/role/constants/roleNames');

var UPDATEDABLE_ORGANIZATION_PROPERTIES = [
  'name',
  'description',
  'location',
  'socialLinks'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
var OrganizationService = function() {
  CommonService.call(this, Organization);
};
util.inherits(OrganizationService, CommonService);

/**
 * @param {object} options
 * @param {string} createdByUserId
 * @param {string} name
 * @param {function} next - callback
 */
OrganizationService.prototype.create = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var _this = this;
  var user = null;
  var organization = null;
  var organizationUser = null;
  var permissions = null;

  async.waterfall([
    function validateData_step(done) {
      organizationValidator.validateCreate(options, done);
    },
    function findUserByUserId_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    function generateProjectSlug_step(_user, done) {
      user = _user;

      generateOrganizationSlug(options.name, done);
    },
    function createOrganization_step(slug, done) {
      var organization = new Organization();
      organization.name = options.name;
      organization.created = new Date();
      organization.modified = organization.created;
      organization.slug = slug
      organization.description = options.description;

      organization.save(done);
    },
    function getOrganizationUserPermissions_step(_organization, numCreated, done) {
      organization = _organization;

      permissionService.getByRoleName({
        roleName: ROLES.ORGANIZATION_ADMIN
      }, done);
    },
    function createProjectUser_step(_permissions, done) {
      permissions = _permissions;

      var organizationUser = new OrganizationUser();
      organizationUser.organization = organization._id;
      organizationUser.user = user._id;
      organizationUser.email = user.email;
      organizationUser.permissions = organizationUser.permissions.concat(permissions);

      organizationUser.save(done);
    },
    function updateOrganization_step(_organizationUser, numCreated, done) {
      organizationUser = _organizationUser;

      organization.organizationUsers.push(organizationUser._id);

      organization.save(function(err, updatedOrganization) {
        if (err) return done(err);

        organization = updatedOrganization;

        done();
      });
    },
    function updateUser_step(done) {
      user.organizationUsers.push(organizationUser._id);

      user.save(function(err, updatedUser) {
        if (err) return done(err);

        user = updatedUser;

        done();
      });
    }
  ], function(err) {
    if (err) return next(err);

    next(null, organization);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function generateOrganizationSlug(organizationName, next) {
  var slug = organizationName.trim().replace(/\s/gi, '-').replace(/('|\.)/gi, '').toLowerCase();

  findUniqueOrganizationSlug(slug, 0, next);
}

function findUniqueOrganizationSlug(slug, attempts, next) {
  var newSlug = attempts > 0 ? slug + attempts : slug;

  findOrganizationBySlug(newSlug, function(err, venues) {
    if (!venues || !venues.length) return next(null, newSlug); //slug is unique
    else { //not unique, bump attempt count, try again
      attempts = attempts + 1;
      findUniqueOrganizationSlug(slug, attempts, next);
    }
  });
}

function findOrganizationBySlug(slug, next) {
  var query = Organization.find({
    slug: slug
  });

  query.select('slug');

  query.exec(next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new OrganizationService();
