/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

var utils = require('utils/utils');

/* =========================================================================
 * Constants
 * ========================================================================= */
var LINK_TYPES = require('modules/common/constants/linkTypes');
var NEED_STATUSES = require('../constants/needStatuses');

/* =========================================================================
 * Schema
 * ========================================================================= */
var needSchema = baseSchema.extend({
  project: {
    type: String,
    ref: 'Project',
    required: true
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
  collection: 'projectneeds'
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
