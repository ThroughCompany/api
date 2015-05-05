/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var ProjectApplication = require('modules/project/data/applicationModel');

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
  key: 'projectApplications',
  model: ProjectApplication
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = userPopulateService;
