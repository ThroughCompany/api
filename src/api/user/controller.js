/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');

//services
var authService = require('modules/auth');
var userService = require('modules/user');
var projectService = require('modules/project');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all users
 */
Controller.prototype.getUsers = function(req, res, next) {
  userService.getAll({}, function(err, users) {
    if (err) return next(err);
    return res.status(200).json(users);
  });
};

/** 
 * @description Create a new user
 */
Controller.prototype.createUser = function(req, res, next) {
  var data = req.body;

  userService.createUsingCredentials(req.body, function(err, newUser) {
    if (err) return next(err);
    else return res.status(201).json(newUser);
  });
};

/** 
 * @description Get user by id
 */
Controller.prototype.getUserById = function(req, res, next) {
  var userId = req.params.id;

  userService.getById({
    userId: userId
  }, function(err, user) {
    if (err) return next(err);
    else res.status(200).json(user);
  });
};

/** 
 * @description Update user
 */
Controller.prototype.updateUserById = function(req, res, next) {
  var userId = req.params.id;
  var updates = req.body;

  userEntityManager.update({
    userId: userId,
    updates: updates
  }, function(err, user) {
    if (err) return next(err);
    else return res.json(200, user);
  });
};

/** 
 * @description Get a user's authorization claims
 */
Controller.prototype.getUserClaimsById = function(req, res, next) {
  var userId = req.params.id;

  authService.getUserClaims({
    userId: userId
  }, function(err, claims) {
    if (err) return next(err);
    return res.status(200).json(claims);
  });
};

/** 
 * @description Get a user's projects
 */
Controller.prototype.getUserProjectsById = function(req, res, next) {
  var userId = req.params.id;

  projectService.getByUserId({
    userId: userId
  }, function(err, projects) {
    if (err) return next(err);
    return res.status(200).json(projects);
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
