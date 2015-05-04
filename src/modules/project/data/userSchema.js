/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Schema
 * ========================================================================= */
var projectUserSchema = baseSchema.extend({
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
  permissions: [{
    type: String,
    ref: 'Permission'
  }]
  // email: {
  //   type: String,
  //   required: true
  // }
}, {
  collection: 'projectusers'
});

projectUserSchema.index({
  project: 1,
  user: 1
}, {
  unique: true
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = projectUserSchema;
