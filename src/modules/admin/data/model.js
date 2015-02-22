/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var adminSchema = require('./schema');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Admin', adminSchema);
