"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var organizationUserSchema = require('./userSchema');

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('OrganizationUser', organizationUserSchema);
