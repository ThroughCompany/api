/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');

var _ = require('underscore');

/* =========================================================================
 * Constants
 * ========================================================================= */
var NEED_STATUSES = require('../constants/needStatuses');
var NEED_TYPES = require('../constants/needTypes');

/* =========================================================================
 * Schema
 * ========================================================================= */
var needSchema = baseSchema.extend({
  organization: {
    type: String,
    ref: 'Organization'
  },
  user: {
    type: String,
    ref: 'User'
  },
  project: {
    type: String,
    ref: 'Project'
  },
  type: {
    type: String,
    required: true,
    enum: _.values(NEED_TYPES)
  },
  skills: [{
    type: String,
    ref: 'Skill',
    required: true
  }],
  name: {
    type: String,
    trim: true,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: _.values(NEED_STATUSES)
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
  },
  timeCommitment: {
    hoursPerWeek: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    }
  },
  locationSpecific: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'needs'
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(needSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = needSchema;
