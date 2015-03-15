/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var path = require('path');
var config = require('app/config');
var async = require('async');

var _ = require('underscore');

//modules
var partialResponse = require('modules/partial-response');
var logger = require('modules/logger');

//models
//var City = require(path.join(config.paths.models, 'city'));

//services
var PopulateService = partialResponse.service;

/* =========================================================================
 * Constructor
 * ========================================================================= */
function ProjectPopulateService() {
  PopulateService.call(this);
}
util.inherits(ProjectPopulateService, PopulateService);

var userPopulateService = new ProjectPopulateService();

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
module.exports = ProjectPopulateService;
