/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');

//services
var authService = require('modules/auth');
var projectService = require('modules/project');
var imageService = require('modules/image');

/* =========================================================================
 * Constants
 * ========================================================================= */
var IMAGE_TYPE_SIZES = require('modules/image/constants/image-type-sizes');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all projects
 */
Controller.prototype.getProjects = function getProjects(req, res, next) {
  projectService.getAll({}, function(err, projects) {
    if (err) return next(err);
    return res.status(200).json(projects);
  });
};

/** 
 * @description Get a project by id
 */
Controller.prototype.getProjectById = function getProjectById(req, res, next) {
  var projectId = req.params.id;

  projectService.getById({
    projectId: projectId
  }, function(err, project) {
    if (err) return next(err);
    return res.status(200).json(project);
  });
};

/** 
 * @description Create a project
 */
Controller.prototype.createProject = function createProject(req, res, next) {
  var data = req.body;
  data.createdByUserId = req.claims.userId;

  projectService.create(data, function(err, newProject) {
    if (err) return next(err);
    return res.status(201).json(newProject);
  });
};

/** 
 * @description Update user
 */
Controller.prototype.updateProjectById = function(req, res, next) {
  var projectId = req.params.id;
  var updates = req.body;

  projectService.update({
    projectId: projectId,
    updates: updates
  }, function(err, project) {
    if (err) return next(err);
    else return res.status(200).json(project);
  });
};

/** 
 * @description Create asset tag
 */
Controller.prototype.createAssetTag = function(req, res, next) {
  var projectId = req.params.id;
  var name = req.body.name;
  var description = req.body.description;

  projectService.createAssetTag({
    projectId: projectId,
    name: name,
    description: description
  }, function(err, project) {
    if (err) return next(err);
    return res.status(201).json(project);
  });
};

/** 
 * @description Upload a user image
 */
Controller.prototype.uploadImage = function(req, res, next) {
  var projectId = req.params.id;
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

  projectService.uploadImage({
    projectId: projectId,
    imageType: imageType,
    fileName: image.name,
    filePath: image.path,
    fileType: image.type
  }, function(err, project) {
    if (err) return next(err);
    return res.status(200).json(project);
  });
};

/** 
 * @description Get project users
 */
Controller.prototype.getProjectUsers = function(req, res, next) {
  var projectId = req.params.id;

  projectService.getUsers({
    projectId: projectId
  }, function(err, users) {
    if (err) return next(err);
    return res.status(200).json(users);
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
