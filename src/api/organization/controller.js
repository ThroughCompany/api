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
