/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var Application = require('modules/application/data/applicationModel');
var Need = require('modules/need/data/needModel');

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

userPopulateService.addPopulate({
  key: 'needs',
  model: Need
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = userPopulateService;
