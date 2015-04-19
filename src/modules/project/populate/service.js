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

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = projectPopulateService;
