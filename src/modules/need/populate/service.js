/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models

//services
var PopulateService = partialResponse.service;

/* =========================================================================
 * Constructor
 * ========================================================================= */
function NeedPopulateService() {
  PopulateService.call(this);
}
util.inherits(NeedPopulateService, PopulateService);

var needPopulateService = new NeedPopulateService();

/* =========================================================================
 * Populates
 * ========================================================================= */

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = needPopulateService;
