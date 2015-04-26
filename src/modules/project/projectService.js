/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var jsonPatch = require('fast-json-patch');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var userService = require('modules/user');
var permissionService = require('modules/permission');
var skillService = require('modules/skill');
var imageService = require('modules/image');
var projectPopulateService = require('./populate/service');
var projectApplicationService = require('./applicationService');
var projectNeedService = require('./needService');
var projectUserService = require('./userService');
var organizationProjectService = require('modules/organization/ProjectService');

//models
var User = require('modules/user/data/model');
var Project = require('modules/project/data/projectModel');
var ProjectUser = require('modules/project/data/userModel');
var ProjectNeed = require('modules/project/data/needModel');
var Organization = require('modules/organization/data/organizationModel');
var OrganizationProject = require('modules/organization/data/projectModel');

//utils
var patchUtils = require('utils/patchUtils');
var utils = require('utils/utils');

var projectValidator = require('./validators/projectValidator');

var partialResponseParser = require('modules/partialResponse/parser');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var ROLES = require('modules/role/constants/roleNames');
var DEFAULT_IMAGEURL = 'https://s3.amazonaws.com/throughcompany-assets/project-avatars/avatar';
var IMAGE_TYPES = require('modules/image/constants/image-types');
var PROJECT_STATUSES = require('modules/project/constants/projectStatuses');

var UPDATEDABLE_PROJECT_PROPERTIES = [
  'name',
  'description',
  'lastName',
  'location',
  'socialLinks',
  'status'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ProjectService = function() {
  CommonService.call(this, Project);
};
util.inherits(ProjectService, CommonService);

/**
 * @param {object} options
 * @param {string} createdByUserId
 * @param {string} name
 * @param {function} next - callback
 */
ProjectService.prototype.create = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var _this = this;
  var user = null;
  var project = null;
  var projectUser = null;
  var permissions = null;

  async.waterfall([
    function validateData_step(done) {
      projectValidator.validateCreate(options, done);
    },
    function findUserByUserId_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    function generateProjectSlug_step(_user, done) {
      user = _user;

      generateProjectSlug(options.name, done);
    },
    function createProject_step(slug, done) {
      project = new Project();

      project.name = options.name;
      project.created = new Date();
      project.modified = project.created;
      project.slug = slug
      project.profilePic = DEFAULT_IMAGEURL + randomNum(1, 4) + '.jpg';
      project.description = options.description;
      project.status = PROJECT_STATUSES.DRAFT;
      project.wiki.pages.push({
        title: 'Start',
        text: 'Wiki for ' + options.name + '...'
      });

      project.save(done);
    },
    function getProjectUserPermissions_step(_project, numCreated, done) {
      project = _project;

      permissionService.getByRoleName({
        roleName: ROLES.PROJECT_ADMIN
      }, done);
    },
    function createProjectUser_step(_permissions, done) {
      permissions = _permissions;

      projectUser = new ProjectUser();
      projectUser.project = project._id;
      projectUser.user = user._id;
      projectUser.email = user.email;
      projectUser.permissions = projectUser.permissions.concat(permissions);

      projectUser.save(function(err, _projectUser) {
        if (err) return done(err);

        projectUser = _projectUser;

        return done(null);
      });
    },
    function createOrganizationProject_step(done) {
      if (!options.organizationId) {
        return done(null);
      } else {
        organizationProjectService.create({
          organizationId: options.organizationId,
          projectId: project._id,
        }, function(err, _organizationProject) {
          if (err) return done(err);

          project.organizationProject = _organizationProject._id;

          return done(null);
        });
      }
    },
    function updateProject_step(done) {
      project.projectUsers.push(projectUser._id);

      project.save(function(err, updatedProject) {
        if (err) return done(err);

        project = updatedProject;

        done();
      });
    },
    function updateUser_step(done) {
      user.projectUsers.push(projectUser._id);

      user.save(function(err, updatedUser) {
        if (err) return done(err);

        user = updatedUser;

        done();
      });
    }
  ], function(err) {
    if (err) return next(err);

    next(null, project);
  });
};

/**
 * @param {object} options
 * @param {string} projectId
 * @param {object} [updates] - a hash of changes to apply to the project
 * @param {array} [patches] - an array of JSON patches to apply to the project
 * @param {function} next - callback
 */
ProjectService.prototype.update = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
  if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
  if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
  if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

  var _this = this;
  var project = null;
  var patches = null;

  async.waterfall([
    function findUserById(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function validateData_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;

      if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
      else patches = options.patches;

      patches = patchUtils.stripPatches(UPDATEDABLE_PROJECT_PROPERTIES, patches);

      console.log('PROJECT');
      console.log(project);

      console.log('PATCHES:');
      console.log(patches);

      var projectClone = _.clone(project.toJSON());

      var patchErrors = jsonPatch.validate(patches, projectClone);

      if (patchErrors) {
        return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
      }

      try {
        jsonPatch.apply(projectClone, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      console.log('WITH PATCHES APPLIED:');
      console.log(projectClone);

      projectValidator.validateUpdate(project, projectClone, done);
    },
    function updateProject(done) {

      try {
        console.log('APPLYING PATCHES:');
        console.log(patches);

        jsonPatch.apply(project, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      console.log('AFTER PATCHES:');
      console.log(project);

      project.save(done);
    }
  ], function finish(err, project) {
    return next(err, project); //don't remove, callback needed because mongoose save returns 3rd arg
  });
};

/**
 * @param {object} options
 * @param {string} projectId
 * @param {string} title
 * @param {object} text
 * @param {function} next - callback
 */
ProjectService.prototype.createWikiPage = function createWikiPage(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.title) return next(new errors.InvalidArgumentError('Title is required'));

  var _this = this;
  var project = null;

  async.waterfall([
    function findProjectById_step(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function createNewPage_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;
      project.wiki.pages.push({
        title: options.title,
        text: options.text,
        created: new Date(),
        modified: new Date()
      });
      project.save(done);
    }
  ], function finish(err, project) {
    if (err) return next(err);

    return next(null, project);
  });
};

ProjectService.prototype.updateWikiPage = function updateWikiPage(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.pageId) return next(new errors.InvalidArgumentError('Page Id is required'));

  var _this = this;
  var project = null;

  async.waterfall([
    function findProjectById_step(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function createNewPage_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;

      var page = _.find(project.wiki.pages, function(page) {
        return page._id === options.pageId;
      });

      if (!page) return done(new errors.ObjectNotFoundError('Page not found'));

      page.title = options.title !== undefined ? options.title : page.title;
      page.text = options.text !== undefined ? options.text : page.text;

      project.save(done);
    }
  ], function finish(err, project) {
    if (err) return next(err);

    return next(null, project);
  });
};

/**
 * @param {object} options
 * @param {string} options.projectId
 * @param {string} options.fields
 * @param {function} next - callback
 */
ProjectService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

  var _this = this;
  var fields = null;
  var expands = null;

  async.waterfall([
    function parseFieldsAndExpands(done) {
      if (options.fields) {
        partialResponseParser.parse({
          fields: options.fields
        }, function(err, results) {
          if (err) return done(err);

          fields = results.fields;
          expands = results.expands;

          return done();
        });
      } else {
        return done(null);
      }
    },
    function getProjectById_step(done) {
      var query = Project.findOne({
        $or: [{
          _id: options.projectId
        }, {
          slug: options.projectId
        }]
      });

      if (fields) {
        query.select(fields.select);
      }

      query.exec(function(err, project) {
        if (err) return done(err);
        if (!project) return done(new errors.ObjectNotFoundError('Project not found'));

        return done(null, project);
      });
    },
    function populate_step(project, done) {
      if (!expands) return done(null, project);

      projectPopulateService.populate({
        docs: project,
        expands: expands
      }, done);
    }
  ], next);
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
ProjectService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (options.status && !_.contains(_.values(PROJECT_STATUSES), options.status)) return next(new errors.InvalidArgumentError(options.status + ' is not a valid project status'));

  var conditions = {};

  if (options.status) {
    conditions.status = options.status;
  } else {
    conditions.status = PROJECT_STATUSES.OPEN;
  }

  var query = Project.find(conditions);

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {string} options.userId
 * @param {function} next - callback
 */
ProjectService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  async.waterfall([
    function findProjectUsersByUserId_step(done) {
      var query = ProjectUser.find({
        user: options.userId
      });

      query.exec(done);
    },
    function findProjectsById_step(projectUsers, done) {
      var projectIds = _.pluck(projectUsers, 'project');

      var query = Project.find({
        _id: {
          $in: projectIds
        }
      });

      query.exec(done);
    }
  ], next);
};

ProjectService.prototype.getUsers = function getUsers(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));

  async.waterfall([
    function findProjectUsers_step(done) {
      ProjectUser.find({
        project: options.projectId
      }, done);
    },
    function getUsers_step(projectUsers, done) {
      User.find({
        _id: {
          $in: _.pluck(projectUsers, 'user')
        }
      }, done);
    }
  ], next);
};

ProjectService.prototype.uploadImage = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.fileName) return next(new errors.InvalidArgumentError('File Name is required'));
  if (!options.filePath) return next(new errors.InvalidArgumentError('File Path is required'));
  if (!options.fileType) return next(new errors.InvalidArgumentError('File Type is required'));
  if (!options.imageType) return next(new errors.InvalidArgumentError('Image Type is required'));

  var validUserImageTypes = [IMAGE_TYPES.PROFILE_PIC_PROJECT, IMAGE_TYPES.BANNER_PIC_PROJECT];

  if (!_.contains(validUserImageTypes, options.imageType)) return next(new errors.InvalidArgumentError(options.imageType + ' is not a valid image type'));

  var _this = this;
  var project = null;

  async.waterfall([
    function getProjectById_step(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function uploadImage_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;

      imageService.upload({
        imageType: options.imageType,
        fileName: options.fileName,
        filePath: options.filePath,
        fileType: options.fileType
      }, done);
    },
    function addImageToProject_step(imageUrl, done) {
      var err = null;

      switch (options.imageType) {
        case IMAGE_TYPES.PROFILE_PIC_PROJECT:
          project.profilePic = imageUrl;
          break;
        case IMAGE_TYPES.BANNER_PIC_PROJECT:
          project.bannerPic = imageUrl;
          break;
        default:
          err = new errors.InvalidArgumentError('Invalid image type');
          break;
      }

      if (err) {
        return done(err);
      } else {
        project.save(done);
      }
    }
  ], next);
};

/* =========================================================================
 * Project Needs
 * ========================================================================= */
/**
 * @param {object} options
 * @param {string} projectId
 * @param {string} name
 * @param {object} updates
 * @param {function} next - callback
 */
ProjectService.prototype.createNeed = function createNeed(options, next) {
  var _this = this;

  projectNeedService.create(options, function(err, projectNeed) {
    if (err) return next(err);

    console.log(projectNeed);

    _.each(projectNeed.skills, function(skill) {
      _this.emit(EVENTS.SKILL_USED_BY_PROJECT, {
        skillId: skill
      });
    });

    return next(null, projectNeed);
  });
};

/**
 * @param {object} options
 * @param {string} projectId
 * @param {string} name
 * @param {object} updates
 * @param {function} next - callback
 */
ProjectService.prototype.updateNeedById = function createNeed(options, next) {
  projectNeedService.update(options, next);
};

/* =========================================================================
 * Project Applications
 * ========================================================================= */
ProjectService.prototype.createApplication = function createApplication(options, next) {
  var _this = this;

  projectApplicationService.create(options, function(err, projectApplication) {
    if (err) return next(err);

    _this.emit(EVENTS.PROJECT_APPLICATION_CREATED, {
      projectApplicationId: projectApplication._id,
      projectId: projectApplication.project,
      userId: projectApplication.user
    });

    return next(null, projectApplication);
  });
};

// ProjectService.prototype.acceptApplication = function acceptApplication(options, next) {
//   var _this = this;

//   projectApplicationService.accept(options, function(err, projectApplication) {
//     if (err) return next(err);

//     //TODO: implement this - email the accepted user
//     // _this.emit(EVENTS.APPLICATION_ACCEPTED, {
//     //   projectApplicationId: projectApplication._id,
//     //   projectId: projectApplication.project,
//     //   userId: projectApplication.user
//     // });

//     next(null, projectApplication);
//   });
// };

ProjectService.prototype.getApplications = function getApplications(options, next) {
  var _this = this;

  projectApplicationService.getByProjectId(options, next);
};

/* =========================================================================
 * Project Users
 * ========================================================================= */

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
ProjectService.prototype.getProjectUsersByUserId = function getProjectUsersByUserId(options, next) {
  projectUserService.getByUserId(options, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProjectSlug(projectName, next) {
  var slug = projectName.trim().replace(/\s/gi, '-').replace(/('|\.)/gi, '').toLowerCase();

  findUniqueProjectSlug(slug, 0, next);
}

function findUniqueProjectSlug(slug, attempts, next) {
  var newSlug = attempts > 0 ? slug + attempts : slug;

  findProjectBySlug(newSlug, function(err, venues) {
    if (!venues || !venues.length) return next(null, newSlug); //slug is unique
    else { //not unique, bump attempt count, try again
      attempts = attempts + 1;
      findUniqueProjectSlug(slug, attempts, next);
    }
  });
}

function findProjectBySlug(slug, next) {
  var query = Project.find({
    slug: slug
  });

  query.select('slug');

  query.exec(next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new ProjectService();
