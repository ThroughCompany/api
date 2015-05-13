/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');
var extend = require('mongoose-schema-extend');

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
}, {
  collection: 'organizationusers'
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
