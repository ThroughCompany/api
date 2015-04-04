/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

//modules
var partialResponse = require('modules/partialResponse');

//models
var ProjectUser = require('modules/project/data/userModel');
var ProjectApplication = require('modules/project/data/applicationModel');

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
  model: ProjectApplication
});

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = projectPopulateService;
