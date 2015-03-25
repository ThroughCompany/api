/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Constants
 * ========================================================================= */
var STATUSES = require('../constants/statuses');

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
  status: {
    type: String,
    required: true,
    enum: _.values(STATUSES)
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
