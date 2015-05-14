/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

var errors = require('modules/error');

//services
var authService = require('modules/auth');
var invitationService = require('modules/invitation');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

Controller.prototype.createInvitation = function(req, res, next) {
  var createdByUserId = req.claims.userId;
  var userId = req.body.userId;
  var organizationId = req.body.organizationId;
  var projectId = req.body.projectId;

  invitationService.create({
    createdByUserId: createdByUserId,
    userId: userId,
    organizationId: organizationId,
    projectId: projectId
  }, function(err, invitation) {
    if (err) return next(err);
    return res.status(201).json(invitation);
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
