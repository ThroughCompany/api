/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var projectSchema = require('./projectSchema');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Project', projectSchema);