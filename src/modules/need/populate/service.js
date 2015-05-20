/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var Organization = require('modules/organization/data/organizationModel');
var User = require('modules/user/data/model');
var Project = require('modules/project/data/projectModel');

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
 needPopulateService.addPopulate({
  key: 'organization',
  model: Organization
});

needPopulateService.addPopulate({
  key: 'project',
  model: Project
});

needPopulateService.addPopulate({
  key: 'user',
  model: User
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = needPopulateService;
