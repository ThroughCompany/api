/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');
var extend = require('mongoose-schema-extend');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Schema
 * ========================================================================= */
var skillSchema = baseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true,
    index: {
      unique: true
    }
  },
  slug: {
    type: String,
    trim: true,
    required: true,
    index: {
      unique: true
    }
  },
  organizationUseCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userUseCount: {
    type: Number,
    default: 0,
    min: 0
  },
  projectUseCount: {
    type: Number,
    default: 0,
    min: 0
  }
});

/* =========================================================================
 * Hooks
 * ========================================================================= */

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(skillSchema.statics, {});

/* ========================================================================= 
 * Virtuals 
 * ========================================================================= */
skillSchema.virtual('totalUseCount')
  .get(function() {
    return this.organizationUseCount + this.projectUseCount + this.userUseCount;
  });

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = skillSchema;
