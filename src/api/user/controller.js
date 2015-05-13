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
var organizationService = require('modules/organization');
var applicationService = require('modules/application');

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
  var fields = req.query.fields;

  userService.getById({
    userId: userId,
    fields: fields
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
  var patches = req.body.patches;

  userService.update({
    userId: userId,
    patches: patches
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
 * @description Get a user's organization
 */
Controller.prototype.getUserOrganizationsById = function(req, res, next) {
  var userId = req.params.id;

  organizationService.getByUserId({
    userId: userId
  }, function(err, organizations) {
    if (err) return next(err);
    return res.status(200).json(organizations);
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
Controller.prototype.createSkill = function(req, res, next) {
  var userId = req.params.id;
  var name = req.body.name;
  var description = req.body.description;

  userService.createSkill({
    userId: userId,
    name: name,
    description: description
  }, function(err, skill) {
    if (err) return next(err);
    return res.status(201).json(skill);
  });
};

/** 
 * @description Get user applications
 */
Controller.prototype.getUserApplications = function(req, res, next) {
  var userId = req.params.id;
  var type = req.query.type;

  if (!type) return next(new errors.InvalidArgumentError('Type is required'));

  if (type === 'User') {
    applicationService.getUserApplications({
      userId: userId
    }, function(err, applications) {
      if (err) return next(err);
      return res.status(200).json(applications);
    });
  } else if (type === 'UserCreated') {
    applicationService.getUserCreatedApplications({
      userId: userId
    }, function(err, applications) {
      if (err) return next(err);
      return res.status(200).json(applications);
    });
  } else {
    return next(new errors.InvalidArgumentError(type + ' is not a valid user application type'));
  }
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
