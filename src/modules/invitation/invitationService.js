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

//models
var Organization = require('modules/organization/data/organizationModel');
var Project = require('modules/project/data/projectModel');
var OrganizationUser = require('modules/organization/data/userModel');
var ProjectUser = require('modules/project/data/userModel');
var Invitation = require('modules/invitation/data/invitationModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var invitationValidator = require('./validators/invitationValidator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var INVITATION_STATUSES = require('modules/invitation/constants/invitationStatuses');
var INVITATION_TYPES = require('modules/invitation/constants/invitationTypes');
var EVENTS = require('modules/invitation/constants/events');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var InvitationService = function() {
  CommonService.call(this, Invitation);
};
util.inherits(InvitationService, CommonService);

/**
 * @param {object} options
 * @param {function} next - callback
 */
InvitationService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId && !options.organizationId) return next(new errors.InvalidArgumentError('Organization Id, or Project Id is required'));
  if (!options.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (options.createdByUserId === options.userId) return next(new errors.InvalidArgumentError('Cannot invite your self'));

  var _this = this;
  var organization = null;
  var organizationUsers = null;
  var project = null;
  var projectUsers = null;
  var user = null; //the invitee
  //var createdByUser = null; //the invitor

  var invitation = null;

  async.waterfall([
    function getEntityByData_step(done) {
      //TODO: only select needed fields in these DB calls
      async.parallel([
        function findInviteeUserById_step(cb) {
          userService.getById({
            userId: options.userId
          }, function(err, _user) {
            if (err) return cb(err);

            user = _user;

            return cb(null);
          });
        },
        function findInvitorUserById_step(cb) {
          userService.getById({
            userId: options.createdByUserId
          }, function(err, _user) {
            if (err) return cb(err);

            createdByUser = _user;

            return cb(null);
          });
        },
        function findEntityById_step(cb) {
          if (options.organizationId) {
            Organization.findById(options.organizationId, function(err, _organization) {
              if (err) return cb(err);

              if (!_organization) return cb(new errors.ObjectNotFoundError('No organization exists with the id ' + options.organizationId));

              organization = _organization;

              return cb(null);
            });
          } else {
            Project.findById(options.projectId, function(err, _project) {
              if (err) return cb(err);

              if (!_project) return cb(new errors.ObjectNotFoundError('No project exists with the id ' + options.projectId));

              project = _project;

              return cb(null);
            });
          }
        },
        // function getEntityUsersById_step(cb) {
        //   if (options.organizationId) {
        //     OrganizationUser.find({
        //       organization: options.organizationId
        //     }, function(err, _organizationUsers) {
        //       if (err) return cb(err);

        //       organizationUsers = _organizationUsers;

        //       var invitingOrganizationUser = _.find(organizationUsers, function(organizationUser) {
        //         return organizationUser.user === options.createdByUserId;
        //       });

        //       if (!invitingOrganizationUser) return cb(new errors.ObjectNotFoundError('You are not a member of this organization'));

        //       return cb(null);
        //     });
        //   } else {
        //     ProjectUser.find({
        //       project: options.projectId
        //     }, function(err, _projectUsers) {
        //       if (err) return cb(err);

        //       projectUsers = _projectUsers;

        //       var invitingProjectUser = _.find(projectUsers, function(projectUser) {
        //         return projectUser.user === options.createdByUserId;
        //       })

        //       if (!invitingProjectUser) return cb(new errors.ObjectNotFoundError('You are not a member of this project'));

        //       return cb(null);
        //     });
        //   }
        // },
        function getInvitationsById_step(cb) {
          var conditions = {
            status: INVITATION_STATUSES.PENDING,
            user: options.userId
          };

          if (options.organizationId) conditions.organization = options.organizationId;
          if (options.projectId) conditions.project = options.projectId;

          Invitation.find(conditions, function(err, _invitations) {
            if (err) return cb(err);

            if (_invitations && _invitations.length) {
              return cb(new errors.InvalidArgumentError('User has already been invited and cannot be invited again'));
            }

            return cb(null);
          });
        }
      ], function(err) {
        if (err) return done(err);

        return done(null);
      });
    },
    function createInvitation_step(done) {
      var invitation = new Invitation();

      if (organization) {
        invitation.organization = organization._id;
        invitation.type = INVITATION_TYPES.ORGANIZATION;
      }
      if (project) {
        invitation.project = project._id;
        invitation.type = INVITATION_TYPES.PROJECT;
      }

      invitation.user = user._id;
      invitation.status = INVITATION_STATUSES.PENDING;

      invitation.save(function(err, invitation) {
        if (err) return done(err);
        return done(null, invitation);
      });
    },
    function updateEntityWithInvitation_step(_invitation, done) {
      invitation = _invitation;

      if (organization) {
        organization.invitations.push(invitation._id);

        organization.save(function(err) {
          if (err) return done(err);
          return done(null);
        });
      } else {
        project.invitations.push(invitation._id);

        project.save(function(err) {
          if (err) return done(err);
          return done(null);
        });
      }
    },
    function updateUserWithInvitation_step(done) {
      user.invitations.push(invitation._id);
      user.save(function(err) {
        if (err) return done(err);
        return done(null, invitation);
      });
    }
  ], function(err) {
    if (err) return next(err);

    _this.emit(EVENTS.INVITATION_CREATED, {
      invitationId: invitation._id,
      organizationId: organization ? organization._id : null,
      projectId: project ? project._id : null,
      userId: user._id
    });

    return next(null, invitation);
  });
};

/**
 * @param {object} options
 * @param {string} options.userId
 * @param {function} next - callback
 */
InvitationService.prototype.getByUserId = function getByUserId(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var conditions = {
    user: options.userId
  };

  var query = Invitation.find(conditions);

  query.exec(next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new InvitationService();
