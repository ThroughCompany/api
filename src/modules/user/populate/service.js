/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var Application = require('modules/application/data/applicationModel');

//services
var PopulateService = partialResponse.service;

/* =========================================================================
 * Constructor
 * ========================================================================= */
function UserPopulateService() {
  PopulateService.call(this);
}
util.inherits(UserPopulateService, PopulateService);

var userPopulateService = new UserPopulateService();

/* =========================================================================
 * Populates
 * ========================================================================= */
userPopulateService.addPopulate({
  key: 'applications',
  model: Application
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = userPopulateService;
