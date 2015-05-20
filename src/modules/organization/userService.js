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

//models
var OrganizationUser = require('modules/organization/data/userModel');

/* =========================================================================
 * Constants
 * ========================================================================= */
var ROLES = require('modules/role/constants/roleNames');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var OrganizationUserService = function() {
  CommonService.call(this, OrganizationUser);
};
util.inherits(OrganizationUserService, CommonService);

/**
 * @param {object} options
 * @param {object} [options.organizationId]
 * @param {object} [project]
 * @param {object} [options.userId]
 * @param {object} [user]
 * @param {function} next - callback
 */
OrganizationUserService.prototype.create = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId && !options.organization) return next(new errors.InvalidArgumentError('Organization Id or Organization is required'));
  if (!options.userId && !options.user) return next(new errors.InvalidArgumentError('User Id or User is required'));

  if (options.role && !_.contains(_.values(ROLES), options.role)) return next(new errors.InvalidArgumentError(options.role + ' is not a valid role'));

  var _this = this;
  var organization = null;
  var organizationUser = null;
  var organizationUsers = null;
  var user = null;
  var permissions = null;

  async.waterfall([
    function findOrganizationandUsers_step(done) {
      async.parallel([
        function findOrganizationById_step(cb) {
          if (options.organization) {
            //TODO: should we verify this is an actual Mongoose object somehow? could check __t prop === 'Project'
            return cb(null, options.organization);
          } else {
            Organization.findById(options.organizationId, cb);
          }
        },
        function findOrganizationUsersByOrganizationId_step(cb) {
          OrganizationUser.find({
            organization: options.organization ? options.organization._id : options.organizationId
          }, cb);
        },
        function findUserById_step(cb) {
          if (options.user) {
            return cb(null, options.user);
          } else {
            User.findById(options.userId, cb);
          }
        }
      ], function(err, results) {
        if (err) return done(err);

        organization = results[0];
        organizationUsers = results[1];
        user = results[2];

        var organizationUserIds = _.pluck(organizationUsers, 'user');

        if (_.contains(organizationUserIds, options.user ? options.user._id : options.userId)) return done(new errors.InvalidArgumentError('User is already a member of this organization'));

        return done(null);
      });
    },
    function getOrganizationUserPermissions_step(done) {
      permissionService.getByRoleName({
        roleName: options.role || ROLES.ORGANIZATION_MEMBER
      }, done);
    },
    function createOrganizationUser_step(_permissions, done) {
      permissions = _permissions;

      organizationUser = new OrganizationUser();
      organizationUser.organization = organization._id;
      organizationUser.user = user._id;
      organizationUser.permissions = organizationUser.permissions.concat(permissions);

      organizationUser.save(function(err, _organizationUser) {
        if (err) return done(err);

        organizationUser = _organizationUser;

        return done(null);
      });
    },
    function updateOrganization_step(done) {
      organization.organizationUsers.push(organizationUser._id);

      organization.save(function(err, updatedOrganization) {
        if (err) return done(err);

        organization = updatedOrganization;

        return done();
      });
    },
    function updateUser_step(done) {
      user.organizationUsers.push(organizationUser._id);

      user.save(function(err, updatedUser) {
        if (err) return done(err);

        user = updatedUser;

        return done();
      });
    }
  ], function(err) {
    if (err) return next(err);

    return next(null, organizationUser);
  });
};

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
OrganizationUserService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  var query = OrganizationUser.find({
    user: options.userId
  });

  query.exec(next);
};

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
OrganizationUserService.prototype.getByOrganizationId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));

  var _this = this;

  var query = OrganizationUser.find({
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
module.exports = new OrganizationUserService();
