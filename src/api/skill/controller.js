/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');

//services
var skillService = require('modules/skill');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all asset tags
 */
Controller.prototype.getAll = function getAll(req, res, next) {
  var name = req.query.name;
  var needId = req.query.needId;

  skillService.getAll({
    name: name,
    needId: needId
  }, function(err, skills) {
    if (err) return next(err);
    return res.status(200).json(skills);
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
