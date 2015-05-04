/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Constants
 * ========================================================================= */
var APPLICATION_STATUSES = require('../constants/applicationStatuses');

/* =========================================================================
 * Schema
 * ========================================================================= */
var applicationSchema = baseSchema.extend({
  project: {
    type: String,
    ref: 'Project',
    required: true
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  projectNeed: {
    type: String,
    ref: 'ProjectNeed',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: _.values(APPLICATION_STATUSES)
  }
}, {
  collection: 'projectapplications'
});

applicationSchema.index({
  project: 1,
  user: 1
}, {
  unique: true
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(applicationSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = applicationSchema;
