/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Constants
 * ========================================================================= */
var INVITATION_STATUSES = require('../constants/invitationStatuses');
var INVITATION_TYPES = require('../constants/invitationTypes');

/* =========================================================================
 * Schema
 * ========================================================================= */
var invitationSchema = baseSchema.extend({
  organization: {
    type: String,
    ref: 'Organization'
  },
  project: {
    type: String,
    ref: 'Project'
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: _.values(INVITATION_TYPES)
  },
  status: {
    type: String,
    required: true,
    enum: _.values(INVITATION_STATUSES)
  }
}, {
  collection: 'invitations'
});

invitationSchema.index({ //only allow one invitation per user/org
  organization: 1,
  user: 1
}, {
  unique: true,
  sparse: true
});

invitationSchema.index({ //only allow one invitation per user/project
  project: 1,
  user: 1
}, {
  unique: true,
  sparse: true
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(invitationSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = invitationSchema;
