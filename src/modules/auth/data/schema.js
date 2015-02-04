'use strict';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Schema
 * ========================================================================= */
var authSchema = baseSchema.extend({
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  hash: {
    type: String,
    trim: true
  }
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = authSchema;
