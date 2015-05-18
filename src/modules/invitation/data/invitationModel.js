/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var invitationSchema = require('./invitationSchema');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Invitation', invitationSchema);