/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var path = require('path');
var async = require('async');

var _ = require('underscore');

//modules
var partialResponse = require('modules/partialResponse');
var logger = require('modules/logger');

//models
var ProjectUser = require('modules/projectUser/data/model');
var Application = require('modules/projectApplication/data/model');

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

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = projectPopulateService;
