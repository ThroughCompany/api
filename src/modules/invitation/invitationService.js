'use strict';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var jsonPatch = require('fast-json-patch');

//modules
const invitationRepository = require('./data/invitationRepository');
var errors = require('modules/error');
var CommonService = require('modules/common');
var userService = require('modules/user');
var projectUserService = require('modules/project/userService');
var organizationUserService = require('modules/organization/userService');

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

var UPDATEDABLE_INVITATION_PROPERTIES = [
  'status'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
class InvitationService extends CommonService {
  constructor() {
    super(invitationRepository);
  }

  /**
   * @param {object} options
   * @param {function} next - callback
   */
  create(options, next) {
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
    var createdByUser = null; //the invitor

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
  }

  /**
   * @param {object} options
   * @param {function} next - callback
   */
  update(options, next) {
    if (!options) return next(new errors.InvalidArgumentError('options is required'));
    if (!options.projectId && !options.organizationId) return next(new errors.InvalidArgumentError('Organization Id, or Project Id is required'));
    if (!options.invitationId) return next(new errors.InvalidArgumentError('Invitation Id is required'));
    if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
    if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
    if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
    if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

    var _this = this;
    var organization = null;
    var project = null;

    async.waterfall([
      function findEntityAndInvitation(done) {
        async.parallel([
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
          function findInvitationById(cb) {
            var conditions = {
              _id: options.invitationId
            };

            if (options.organizationId) conditions.organization = options.organizationId;
            if (options.projectId) conditions.project = options.projectId;

            Invitation.findById(conditions, function(err, _invitation) {
              if (!_invitation) return done(new errors.ObjectNotFoundError('No invitation exists with the id ' + options.invitationId));

              invitation = _invitation;

              cb();
            });
          },
        ], function(err) {
          if (err) return done(err);
          return done(err);
        });
      },
      function validateData_step(done) {

        var invitations;

        if (organization) invitations = organization.invitations;
        if (project) invitations = project.invitations;

        if (!_.contains(invitations, options.invitationsId)) return done(new errors.InvalidArgumentError(options.invitationsId + ' is not an invitations for this ' + (organization ? 'organization' : 'project')));

        if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
        else patches = options.patches;

        patches = patchUtils.stripPatches(UPDATEDABLE_INVITATION_PROPERTIES, patches);

        console.log('INVITATION');
        console.log(invitation);

        console.log('PATCHES:');
        console.log(patches);

        var invitationClone = _.clone(invitation.toJSON());

        var patchErrors = jsonPatch.validate(patches, invitationClone);

        if (patchErrors) {
          return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
        }

        try {
          jsonPatch.apply(invitationClone, patches);
        } catch (err) {
          logger.error(err);

          return done(new errors.InvalidArgumentError('error applying patches'));
        }

        console.log('WITH PATCHES APPLIED:');
        console.log(invitationClone);

        invitationValidator.validateUpdate(invitation, invitationClone, done);
      },
      function updatedInvitation(done) {

        try {
          console.log('APPLYING PATCHES:');
          console.log(patches);

          jsonPatch.apply(invitation, patches);
        } catch (err) {
          logger.error(err);

          return done(new errors.InvalidArgumentError('error applying patches'));
        }

        console.log('AFTER PATCHES:');
        console.log(invitation);

        invitation.save(done);
      },
      function addProjectUser_step(updatedInvitation, numUpdated, done) {
        invitation = updatedInvitation;

        //project invitation accepted
        if (invitation.type === INVITATION_TYPES.PROJECT && patchUtils.patchesContainsWithValue(patches, '/status', INVITATION_STATUSES.APPROVED)) {
          projectUserService.create({
            projectId: invitation.project,
            userId: invitation.createdByUser,
            role: ROLES.PROJECT_MEMBER
          }, done);
        } else if (invitation.type === INVITATION_TYPES.ORGANIZATION) {
          organizationUserService.create({
            organizationId: invitation.organization,
            userId: invitation.createdByUser,
            role: ROLES.ORGANIZATION_MEMBER
          }, done);
        } else {
          done();
        }
      }
    ], function finish(err) {
      if (err) return next(err);

      // if (options.status === INVITATION_STATUSES.APPROVED) {
      //   _this.emit(EVENTS.APPLICATION_APPROVED, {
      //     projectId: project._id,
      //     userId: user._id,
      //     projectApplicationId: projectApplication._id
      //   });
      // } else if (options.status === APPLICATION_STATUSES.DECLINED) {
      //   _this.emit(EVENTS.PROJECT_APPLICATION_DECLINED, {
      //     projectId: project._id,
      //     userId: user._id,
      //     applicationId: application._id
      //   });
      // }

      return next(null, invitation);
    });
  }

  /**
   * @param {object} options
   * @param {string} options.userId
   * @param {function} next - callback
   */
  getByUserId(options, next) {
    if (!options) return next(new errors.InvalidArgumentError('options is required'));
    if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

    var conditions = {
      user: options.userId
    };

    var query = Invitation.find(conditions);

    query.exec(next);
  }
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new InvitationService();
