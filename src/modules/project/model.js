"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var util = require('util');
var BaseSchema = require('../models/Base').schema;

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Schema
 * ========================================================================= */
var projectSchema = BaseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true
  },
  users: [{
    type: String,
    ref: 'User'
  }]
}, {
  collection: 'projects'
});

/* =========================================================================
 *
 *   Exports
 *
 * ========================================================================= */
module.exports = {
  model: mongoose.model('Project', projectSchema),
  schema: projectSchema
};
