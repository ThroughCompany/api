"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var organizationSchema = require('./userSchema');

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Organization', organizationSchema);
