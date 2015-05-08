/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Constants
 * ========================================================================= */
var APPLICATION_STATUSES = require('../constants/applicationStatuses');
var APPLICATION_TYPES = require('../constants/applicationTypes');

/* =========================================================================
 * Schema
 * ========================================================================= */
var applicationSchema = baseSchema.extend({
  organization: {
    type: String,
    ref: 'Organization'
  },
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  project: {
    type: String,
    ref: 'Project',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: _.values(APPLICATION_TYPES)
  },
  createdByUser: {
    type: String,
    ref: 'User',
    required: true
  },
  createdByUserName: {
    type: String,
    trim: true
  },
  createdByUserFirstName: {
    type: String,
    trim: true
  },
  createdByUserLastName: {
    type: String,
    trim: true
  },
  need: {
    type: String,
    ref: 'Need',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: _.values(APPLICATION_STATUSES)
  }
}, {
  collection: 'applications'
});

applicationSchema.index({
  organization: 1,
  createdByUser: 1
}, {
  unique: true,
  sparse: true
});

applicationSchema.index({
  project: 1,
  createdByUser: 1
}, {
  unique: true,
  sparse: true
});

applicationSchema.index({
  user: 1,
  createdByUser: 1
}, {
  unique: true,
  sparse: true
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
