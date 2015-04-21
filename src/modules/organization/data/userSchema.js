/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Schema
 * ========================================================================= */
var organizationUserSchema = baseSchema.extend({
  organization: {
    type: String,
    ref: 'Organization',
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
});

organizationUserSchema.index({
  organization: 1,
  user: 1
}, {
  unique: true
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = organizationUserSchema;
