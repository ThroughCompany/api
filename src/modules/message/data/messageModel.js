/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var messageSchema = require('./messageSchema');

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Message', messageSchema);
