/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Schema
 * ========================================================================= */
var permissionSchema = baseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  roles: [{
    type: String,
    ref: 'Role'
  }]
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = permissionSchema;
