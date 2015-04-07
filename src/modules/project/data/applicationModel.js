/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var projectApplicationSchema = require('./applicationSchema');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('ProjectApplication', projectApplicationSchema);