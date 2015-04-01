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

var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var IMAGE_TYPE_SIZES = require('modules/image/constants/image-type-sizes');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all users
 */
Controller.prototype.getUsers = function(req, res, next) {
  var select = req.fields ? req.fields.select : null;
  var expands = req.expands;

  userService.getAll({
    select: select
  }, function(err, users) {
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
    else return res.status(200).json(user);
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
Controller.prototype.uploadImage = function(req, res, next) {
  var userId = req.params.id;
  var imageType = req.query.imageType;
  var files = req.files;

  if (!files || !files.image) {
    return cleanup(files, function(err) {
      if (err) return next(err);
      return next(new errors.InvalidArgumentError('Image is required'));
    });
  }

  var image = files.image;

  if (image.size > IMAGE_TYPE_SIZES.PROFILE_PIC) return next(new errors.InvalidArgumentError('file size cannot exceed ' + IMAGE_TYPE_SIZES.PROFILE_PIC + ' bytes'));

  userService.uploadImage({
    userId: userId,
    imageType: imageType,
    fileName: image.name,
    filePath: image.path,
    fileType: image.type
  }, function(err, user) {
    if (err) return next(err);
    return res.status(200).json(user);
  });
};

/** 
 * @description Create asset tag
 */
Controller.prototype.createAssetTag = function(req, res, next) {
  var userId = req.params.id;
  var name = req.body.name;
  var description = req.body.description;

  userService.createAssetTag({
    userId: userId,
    name: name,
    description: description
  }, function(err, assetTag) {
    if (err) return next(err);
    return res.status(201).json(assetTag);
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
  if (!filePaths || !filePaths.length) return next();

  async.each(filePaths, function(filePath, done) {
    fs.unlink(filePath, done);
  }, next);
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
