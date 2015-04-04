/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partial-response');

//models
//var City = require(path.join(config.paths.models, 'city'));

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
// venuePopulateService.addPopulate({
//   key: 'location.city',
//   model: City
// });

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = userPopulateService;
