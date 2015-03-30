/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var userService = require('modules/user');
var permissionService = require('modules/permission');
var assetTagService = require('modules/assetTag');
var imageService = require('modules/image');
var projectPopulateService = require('./populate/service');

//models
var User = require('modules/user/data/model');
var Project = require('./data/model');
var ProjectUser = require('modules/projectUser/data/model');

var validator = require('./validator');

var partialResponseParser = require('modules/partialResponse/parser');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = require('./constants/events');
var ROLES = require('modules/role/constants/role-names');
var DEFAULTIMAGEURL = 'https://s3.amazonaws.com/throughcompany-assets/project-avatars/avatar';
var IMAGE_TYPES = require('modules/image/constants/image-types');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var ProjectService = function() {
  CommonService.call(this, Project);
};
util.inherits(ProjectService, CommonService);

/**
 * @param {object} options
 * @param {string} createdBydUserId
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
      validator.validateCreate(options, done);
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

      var project = new Project();
      project.name = options.name;
      project.created = new Date();
      project.modified = project.created;
      project.slug = slug
      project.profilePic = DEFAULTIMAGEURL + randomNum(1, 4) + '.jpg';
      project.description = options.description;
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

      var projectUser = new ProjectUser();
      projectUser.project = project._id;
      projectUser.user = user._id;
      projectUser.permissions = projectUser.permissions.concat(permissions);

      projectUser.save(done);
    },
    function updateProject_step(_projectUser, numCreated, done) {
      projectUser = _projectUser;

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
 * @param {string} userId
 * @param {object} updates
 * @param {function} next - callback
 */
ProjectService.prototype.update = function(options, next) {
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.updates) return next(new errors.InvalidArgumentError('Updates is required'));

  var _this = this;
  var updates = options.updates;
  var project = null;

  async.waterfall([
    function findUserById(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function validateData_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;

      validator.validateUpdate(project, options, done);
    },
    function updateProject(done) {
      project.name = updates.name ? updates.name : project.name;
      project.description = updates.description ? updates.description : project.description;
      project.location = updates.location ? updates.location : project.location;

      // if (updates.social) {
      //   project.social.facebook = updates.social.facebook ? updates.social.facebook : project.social.facebook;
      //   project.social.linkedIn = updates.social.linkedIn ? updates.social.linkedIn : project.social.linkedIn;
      // }

      project.save(done);
    }
  ], function finish(err, results) {
    return next(err, results);
  });
};

/**
 * @param {object} options
 * @param {string} projectId
 * @param {string} name
 * @param {object} updates
 * @param {function} next - callback
 */
ProjectService.prototype.createAssetTag = function createAssetTag(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.projectId) return next(new errors.InvalidArgumentError('Project Id is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;
  var project = null;
  var assetTag = null;

  async.waterfall([
    function findProjectById_step(done) {
      _this.getById({
        projectId: options.projectId
      }, done);
    },
    function findAssetTag_step(_project, done) {
      if (!_project) return done(new errors.InvalidArgumentError('No project exists with the id ' + options.projectId));

      project = _project;

      assetTagService.getOrCreateByName({
        name: options.name
      }, done);
    },
    function addTagToProject_step(_assetTag, done) {

      var existingAssetTag = _.find(project.assetTags, function(assetTag) {
        return assetTag.slug === _assetTag.slug;
      });

      if (existingAssetTag) return done(new errors.InvalidArgumentError(options.name + ' tag already exists. Cannot have duplicate tags'));

      assetTag = _assetTag;

      project.assetTags.push({
        name: assetTag.name,
        slug: assetTag.slug,
        description: options.description
      });

      project.save(done);
    }
  ], function finish(err, project) {
    if (err) return next(err);

    _this.emit(EVENTS.ASSET_TAG_USED_BY_PROJECT, {
      assetTagName: assetTag.name
    });

    return next(null, assetTag);
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

      console.log(project);

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

  var query = Project.find({});

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
          break
        case IMAGE_TYPES.BANNER_PIC_PROJECT:
          project.bannerPic = imageUrl;
          break
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
