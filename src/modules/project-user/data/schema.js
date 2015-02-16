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
  },
  user: {
    type: String,
    ref: 'User',
  },
  permissions: [{
    type: String,
    ref: 'Permission'
  }]
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = projectUserSchema;
