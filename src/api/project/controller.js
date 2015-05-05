/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

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
  var status = req.query.status;
  var skills = req.query.skills;

  projectService.getAll({
    status: status,
    skills: skills
  }, function(err, projects) {
    if (err) return next(err);
    return res.status(200).json(projects);
  });
};

/** 
 * @description Get a project by id
 */
Controller.prototype.getProjectById = function getProjectById(req, res, next) {
  var projectId = req.params.id;
  var fields = req.query.fields;

  async.waterfall([
    function getProjectById_step(done) {
      projectService.getById({
        projectId: projectId,
        fields: fields
      }, done);
    }
  ], function(err, project) {
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
  var patches = req.body.patches;

  projectService.update({
    projectId: projectId,
    patches: patches
  }, function(err, project) {
    if (err) return next(err);
    else return res.status(200).json(project);
  });
};

/** 
 * @description Create skill
 */
Controller.prototype.createProjectNeed = function(req, res, next) {
  var projectId = req.params.id;
  var name = req.body.name;
  var description = req.body.description;
  var skills = req.body.skills;
  var locationSpecific = req.body.locationSpecific;
  var timeCommitment = req.body.timeCommitment;
  var duration = req.body.duration;

  projectService.createNeed({
    projectId: projectId,
    name: name,
    description: description,
    skills: skills,
    locationSpecific: locationSpecific,
    timeCommitment: timeCommitment,
    duration: duration
  }, function(err, projectNeed) {
    if (err) return next(err);
    return res.status(201).json(projectNeed);
  });
};

/** 
 * @description Create skill
 */
Controller.prototype.updateProjectNeedById = function(req, res, next) {
  var projectId = req.params.id;
  var projectNeedId = req.params.needId;
  var patches = req.body.patches;

  projectService.updateNeedById({
    projectId: projectId,
    projectNeedId: projectNeedId,
    patches: patches
  }, function(err, projectNeed) {
    if (err) return next(err);
    return res.status(200).json(projectNeed);
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
  if (image.size > IMAGE_TYPE_SIZES.BANNER_PIC) return next(new errors.InvalidArgumentError('file size cannot exceed ' + IMAGE_TYPE_SIZES.BANNER_PIC + ' bytes'));

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

Controller.prototype.createProjectApplication = function(req, res, next) {
  var projectId = req.params.id;
  var userId = req.claims.userId;
  var needId = req.body.needId;

  projectService.createApplication({
    projectId: projectId,
    userId: userId,
    needId: needId
  }, function(err, projectApplication) {
    if (err) return next(err);
    return res.status(201).json(projectApplication);
  });
};

Controller.prototype.updateProjectApplicationById = function(req, res, next) {
  var projectId = req.params.id;
  var projectApplicationId = req.params.applicationId;
  var patches = req.body.patches;

  projectService.updateApplicationById({
    projectId: projectId,
    projectApplicationId: projectApplicationId,
    patches: patches
  }, function(err, projectApplication) {
    if (err) return next(err);
    return res.status(200).json(projectApplication);
  });
};

Controller.prototype.getProjectApplications = function(req, res, next) {
  var projectId = req.params.id;

  projectService.getApplications({
    projectId: projectId
  }, function(err, projectApplications) {
    if (err) return next(err);
    return res.status(200).json(projectApplications);
  });
};

Controller.prototype.createWikiPage = function(req, res, next) {
  var projectId = req.params.id;
  var title = req.body.title;
  var text = req.body.text;

  projectService.createWikiPage({
    projectId: projectId,
    title: title,
    text: text
  }, function(err, project) {
    if (err) return next(err);
    return res.status(201).json(project);
  });
};

Controller.prototype.updateWikiPage = function(req, res, next) {
  var projectId = req.params.id;
  var pageId = req.params.pageId;
  var title = req.body.title;
  var text = req.body.text;

  projectService.updateWikiPage({
    projectId: projectId,
    pageId: pageId,
    title: title,
    text: text
  }, function(err, project) {
    if (err) return next(err);
    return res.status(200).json(project);
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
