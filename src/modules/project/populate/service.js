/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var ProjectUser = require('modules/project/data/userModel');
var Application = require('modules/application/data/applicationModel');
var Need = require('modules/need/data/needModel');
var OrganizationProject = require('modules/organization/data/projectModel');

//services
var PopulateService = partialResponse.service;

/* =========================================================================
 * Constructor
 * ========================================================================= */
function ProjectPopulateService() {
  PopulateService.call(this);
}
util.inherits(ProjectPopulateService, PopulateService);

var projectPopulateService = new ProjectPopulateService();

/* =========================================================================
 * Populates
 * ========================================================================= */
projectPopulateService.addPopulate({
  key: 'projectUsers',
  model: ProjectUser
});
projectPopulateService.addPopulate({
  key: 'applications',
  model: Application
});
projectPopulateService.addPopulate({
  key: 'needs',
  model: Need
});
projectPopulateService.addPopulate({
  key: 'organizationProject',
  model: OrganizationProject
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = projectPopulateService;
