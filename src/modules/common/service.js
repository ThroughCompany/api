/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var events = require('events');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function CommonService(model) {
  if (!model) throw new Error('model is required.');

  events.EventEmitter.call(this);

  this.Model = model;
}
util.inherits(CommonService, events.EventEmitter);

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = CommonService;
