/* =========================================================================
 * Dependencies
 * ========================================================================= */
var baseSchema = require('modules/common/data/base-schema');

var _ = require('underscore');

/* =========================================================================
 * Constants
 * ========================================================================= */
var MESSAGE_TYPES = require('modules/message/constants/messageTypes');

/* =========================================================================
 * Schema
 * ========================================================================= */
var messageSchema = baseSchema.extend({
  message: {
    type: String,
    required: true
  },
  user: {
    type: String,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: _.values(MESSAGE_TYPES)
  }
}, {
  collection: 'messages'
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(messageSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = messageSchema;