/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');
var wikiPageSchema = require('./wikiPageSchema');

var utils = require('utils/utils');

/* =========================================================================
 * Constants
 * ========================================================================= */
var LINK_TYPES = require('modules/common/constants/linkTypes');
var NEED_EMPLOYMENT_TYPES = require('modules/project/constants/needEmploymentTypes');
var DURATION_AMOUNTS = require('modules/project/constants/durationAmounts');

/* =========================================================================
 * Schema
 * ========================================================================= */
var needSchema = baseSchema.extend({
  project: {
    type: String,
    ref: 'Project',
    required: true
  },
  employmentType: {
    type: String,
    trim: true,
    required: true,
    enum: _.keys(NEED_EMPLOYMENT_TYPES),
    default: NEED_EMPLOYMENT_TYPES.VOLUNTEER
  },
  duration: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
  },
  timeCommitment: {},
  // duration: {
  //   min: {
  //     type: Number,
  //     required: true
  //   },
  //   minAmount: {
  //     type: String,
  //     required: true,
  //     enum: _.values(DURATION_AMOUNTS)
  //   },
  //   max: {
  //     type: Number
  //   },
  //   maxAmount: {
  //     type: String,
  //     enum: _.values(DURATION_AMOUNTS)
  //   }
  // },
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
  description: {
    type: String,
    trim: true
  }
  // criteria: [{
  //   description: {
  //     type: String,
  //     trim: true,
  //     required: true
  //   }
  // }]
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
