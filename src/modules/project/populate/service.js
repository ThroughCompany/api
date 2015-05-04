/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var ProjectUser = require('modules/project/data/userModel');
var ProjectApplication = require('modules/project/data/applicationModel');
var ProjectNeed = require('modules/project/data/needModel');
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
  key: 'projectApplications',
  model: ProjectApplication
});
projectPopulateService.addPopulate({
  key: 'projectNeeds',
  model: ProjectNeed
});
projectPopulateService.addPopulate({
  key: 'organizationProject',
  model: OrganizationProject
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = projectPopulateService;
