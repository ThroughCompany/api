/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

//services
var authService = require('modules/auth');
var needService = require('modules/need');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all needs
 */
Controller.prototype.getNeeds = function getNeeds(req, res, next) {
  var status = req.query.status;
  var skills = req.query.skills;

  needService.getAll({
    status: status,
    skills: skills
  }, function(err, needs) {
    if (err) return next(err);
    return res.status(200).json(needs);
  });
};

/** 
 * @description Get a need by id
 */
Controller.prototype.getNeedById = function getNeedById(req, res, next) {
  var needId = req.params.id;
  var fields = req.query.fields;

  async.waterfall([
    function getNeedById_step(done) {
      needService.getById({
        needId: needId,
        fields: fields
      }, done);
    }
  ], function(err, need) {
    if (err) return next(err);
    return res.status(200).json(need);
  });
};

/** 
 * @description Create need
 */
Controller.prototype.createNeed = function(req, res, next) {
  var organizationId = req.body.organizationId;
  var userId = req.body.userId;
  var projectId = req.body.projectId;

  var name = req.body.name;
  var description = req.body.description;
  var skills = req.body.skills;
  var locationSpecific = req.body.locationSpecific;
  var timeCommitment = req.body.timeCommitment;
  var duration = req.body.duration;

  console.log('GOT HERE');

  needService.create({
    organizationId: organizationId,
    projectId: projectId,
    userId: userId,
    name: name,
    description: description,
    skills: skills,
    locationSpecific: locationSpecific,
    timeCommitment: timeCommitment,
    duration: duration
  }, function(err, need) {
    if (err) return next(err);
    return res.status(201).json(need);
  });
};

/** 
 * @description Create skill
 */
// Controller.prototype.updateNeedById = function(req, res, next) {
//   var needId = req.params.id;
//   var patches = req.body.patches;

//   needService.updateNeedById({
//     needId: needId,
//     patches: patches
//   }, function(err, need) {
//     if (err) return next(err);
//     return res.status(200).json(need);
//   });
// };

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
