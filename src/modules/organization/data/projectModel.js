/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var organizationProjectSchema = require('./projectSchema.js');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('OrganizationProject', organizationProjectSchema);
