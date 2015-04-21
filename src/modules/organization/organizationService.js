/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var jsonPatch = require('fast-json-patch');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var Organization = require('./data/organizationModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var organizationValidator = require('./validators/organizationValidator');

var partialResponseParser = require('modules/partialResponse/parser');

/* =========================================================================
 * Constants
 * ========================================================================= */
//var EVENTS = require('./constants/events');

var UPDATEDABLE_ORGANIZATION_PROPERTIES = [
  'name',
  'description',
  'socialLinks'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
var OrganizationService = function() {
  CommonService.call(this, Organization);
};
util.inherits(OrganizationService, CommonService);

/**
 * @param {object} options
 * @param {string} createdByUserId
 * @param {string} name
 * @param {function} next - callback
 */
OrganizationService.prototype.create = function(options, next) {};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new OrganizationService();
