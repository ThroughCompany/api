"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var projectUserSchema = require('./userSchema');

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('ProjectUser', projectUserSchema);
