/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

//services
var authService = require('modules/auth');
var organizationService = require('modules/organization');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get a project by id
 */
Controller.prototype.getOrganizationById = function getOrganizationById(req, res, next) {
  var organizationId = req.params.id;
  var fields = req.query.fields;

  async.waterfall([
    function getOrganizationById_step(done) {
      organizationService.getById({
        organizationId: organizationId,
        fields: fields
      }, done);
    }
  ], function(err, organization) {
    if (err) return next(err);
    return res.status(200).json(organization);
  });
};

/** 
 * @description Create a project
 */
Controller.prototype.createOrganization = function createOrganization(req, res, next) {
  var data = req.body;
  data.createdByUserId = req.claims.userId;

  organizationService.create(data, function(err, newOrganization) {
    if (err) return next(err);
    return res.status(201).json(newOrganization);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
