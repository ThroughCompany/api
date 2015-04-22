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
var organizationProjectSchema = baseSchema.extend({
  organization: {
    type: String,
    ref: 'Organization',
    required: true
  },
  project: {
    type: String,
    ref: 'Project',
    required: true
  }
}, {
  collection: 'organizationprojects'
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(organizationProjectSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = organizationProjectSchema;
