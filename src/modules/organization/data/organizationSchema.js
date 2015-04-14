/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Schema
 * ========================================================================= */
var organizationSchema = baseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true
  }
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
