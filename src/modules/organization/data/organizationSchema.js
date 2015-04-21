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

/* =========================================================================
 * Schema
 * ========================================================================= */
var organizationSchema = baseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  socialLinks: [{
    _id: {
      type: String,
      default: utils.guid,
      required: true
    },
    type: {
      type: String,
      trim: true,
      required: true,
      enum: _.values(LINK_TYPES)
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    link: {
      type: String,
      trim: true,
      required: true
    }
  }],
  // projects: [{
  //   type: String,
  //   ref: 'Project'
  // }],
  // users: [{
  //   type: String,
  //   ref: 'User'
  // }]
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = organizationSchema;
