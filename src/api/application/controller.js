/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

//services
var authService = require('modules/auth');
var applicationService = require('modules/application');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

Controller.prototype.createApplication = function(req, res, next) {
  var createdByUserId = req.claims.userId;
  var organizationId = req.body.organizationId;
  var userId = req.body.userId;
  var projectId = req.body.projectId;
  var needId = req.body.needId;

  projectService.createApplication({
    createdByUserId: createdByUserId,
    organizationId: organizationId,
    projectId: projectId,
    userId: userId,
    needId: needId
  }, function(err, application) {
    if (err) return next(err);
    return res.status(201).json(application);
  });
};

// Controller.prototype.updateApplicationById = function(req, res, next) {
//   var applicationId = req.params.id;
//   var patches = req.body.patches;

//   applicationService.updateApplicationById({
//     applicationId: applicationId,
//     patches: patches
//   }, function(err, application) {
//     if (err) return next(err);
//     return res.status(200).json(application);
//   });
// };

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
