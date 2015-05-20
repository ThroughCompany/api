/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var User = require('modules/user/data/model');

//services
var PopulateService = partialResponse.service;

/* =========================================================================
 * Constructor
 * ========================================================================= */
function ApplicationPopulateService() {
  PopulateService.call(this);
}
util.inherits(ApplicationPopulateService, PopulateService);

var applicationPopulateService = new ApplicationPopulateService();

/* =========================================================================
 * Populates
 * ========================================================================= */
applicationPopulateService.addPopulate({
  key: 'user',
  model: User
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = applicationPopulateService;
