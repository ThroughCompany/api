"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function CommonService(model) {
  if (!model) throw new Error('model is required.');

  this.Model = model;
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = CommonService;
