/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

//services
var authService = require('modules/auth');
var userService = require('modules/user');
var projectService = require('modules/project');
var imageService = require('modules/image');

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

  userService.update({
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

/** 
 * @description Upload a user image
 */
Controller.prototype.upload = function(req, res, next) {
  var files = req.files;

  if (!files.image) {
    return cleanup(files, function(err) {
      if (err) return next(err);
      return next(new errors.InvalidArgumentError('Image is required'));
    });
  }

  var image = files.image;

  imageService.upload({
    imageType: '',
    fileName: image.name,
    filePath: image.path,
    fileType: image.type
  }, function(err, users) {
    if (err) return next(err);
    return res.status(200).json(users);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
/** 
 * @description Delete a set of files
 *
 * @param {array} filePaths - array of file paths
 * @param {function} next - callback
 */
function cleanup(filePaths, next) {
  async.each(filePaths, function(filePath, done) {
    fs.unlink(filePath, done);
  }, next);
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
