"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var organizationSchema = require('./organizationSchema');

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Organization', organizationSchema);
