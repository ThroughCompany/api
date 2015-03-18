/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var Application = require('modules/application/data/model');

var validator = require('./validator');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ApplicationService = function() {
  CommonService.call(this, Application);
};
util.inherits(ApplicationService, CommonService);

/**
 * @param {object} options
 * @param {string} createdBydUserId
 * @param {string} name
 * @param {function} next - callback
 */


/* =========================================================================
 * Private Helpers
 * ========================================================================= */


/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ApplicationService();
