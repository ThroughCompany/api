/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var projectSchema = require('./schema');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Project', projectSchema);