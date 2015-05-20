/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var OrganizationUser = require('modules/organization/data/userModel');

//services
var PopulateService = partialResponse.service;

/* =========================================================================
 * Constructor
 * ========================================================================= */
function OrganizationPopulateService() {
  PopulateService.call(this);
}
util.inherits(OrganizationPopulateService, PopulateService);

var organizationPopulateService = new OrganizationPopulateService();

/* =========================================================================
 * Populates
 * ========================================================================= */
organizationPopulateService.addPopulate({
  key: 'organizationUsers',
  model: OrganizationUser
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = organizationPopulateService;
