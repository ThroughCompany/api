/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');

//services
var authService = require('modules/auth');
var projectService = require('modules/project');

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

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
