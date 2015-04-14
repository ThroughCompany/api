/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');
var multipart = require('connect-multiparty');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');
var multipartMiddleware = multipart();

var controller = require('./controller');

/* =========================================================================
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var getProjects = {
  spec: {
    path: '/projects',
    summary: 'Get a list of projects',
    method: 'GET',
    nickname: 'getProjects',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getProjects(req, res, next);
  }
};

var getProjectById = {
  spec: {
    path: '/projects/{id}',
    summary: 'Get a project by id',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string')
    ],
    nickname: 'getProjects',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getProjectById(req, res, next);
  }
};

var createProject = {
  spec: {
    path: '/projects',
    summary: 'Create a project',
    method: 'POST',
    parameters: [
      swagger.params.body('project', 'project info', 'string')
    ],
    nickname: 'createProject',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      controller.createProject(req, res, next);
    });
  }
};

var createAssetTag = {
  spec: {
    path: '/projects/{id}/assettags',
    summary: 'Add project asset tag',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string'),
      swagger.params.body('tags', 'asset tag', 'string')
    ],
    nickname: 'createAssetTag',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserProjectIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.createAssetTag(req, res, next);
      });
    });
  }
};

var updateProjectById = {
  spec: {
    path: '/projects/{id}',
    summary: 'Update a project by id',
    method: 'PATCH',
    parameters: [
      swagger.params.path('id', 'project\s id', 'string')
    ],
    nickname: 'updateProjectById',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserProjectIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.updateProjectById(req, res, next);
      });
    });
  }
};

var uploadImage = {
  spec: {
    path: '/projects/{id}/images',
    summary: 'Upload a user image',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string')
    ],
    nickname: 'uploadImage',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserProjectIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        multipartMiddleware(req, res, function(err) {
          if (err) return next(err);
          controller.uploadImage(req, res, next);
        });
      });
    });
  }
};

var getProjectUsers = {
  spec: {
    path: '/projects/{id}/users',
    summary: 'Get a project\'s users',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string')
    ],
    nickname: 'getProjectUsers',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getProjectUsers(req, res, next);
  }
};

var createApplication = {
  spec: {
    path: '/projects/{id}/applications',
    summary: 'Apply to a project',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string'),
      swagger.params.body('userId', 'user\'s id', 'string')
    ],
    nickname: 'createApplication',
    type: 'ProjectApplication',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdBodyParamRequired('userId')(req, res, function(err) {
        if (err) return next(err);
        controller.createApplication(req, res, next);
      });
    });
  }
};

var acceptApplication = {
  spec: {
    path: '/projects/{id}/applications/{projectApplicationId}/accept',
    summary: 'App a project application',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string'),
      swagger.params.body('projectApplicationId', 'application\'s id', 'string')
    ],
    nickname: 'acceptApplication',
    type: 'ProjectApplication',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentProjectPermissionParamRequired(PERMISSION_NAMES.ADD_PROJECT_USERS, 'id')(req, res, function(err) {
        if (err) return next(err);
        controller.acceptApplication(req, res, next);
      });
    });
  }
};

var createWikiPage = {
  spec: {
    path: '/projects/{id}/wiki/pages',
    summary: 'Creat a new wiki page',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string'),
      swagger.params.body('title', 'page\'s title', 'string'),
      swagger.params.body('text', 'page\'s text', 'string')
    ],
    nickname: 'createWikiPage',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserProjectIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.createWikiPage(req, res, next);
      });
    });
  }
};

var updateWikiPage = {
  spec: {
    path: '/projects/{id}/wiki/pages/{pageId}',
    summary: 'Update a new wiki page',
    method: 'PATCH',
    parameters: [
      swagger.params.path('id', 'project\'s id', 'string'),
      swagger.params.body('title', 'page\'s title', 'string'),
      swagger.params.body('text', 'page\'s text', 'string')
    ],
    nickname: 'updateWikiPage',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserProjectIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.updateWikiPage(req, res, next);
      });
    });
  }
};

swagger.addGet(getProjects);
swagger.addGet(getProjectById);
swagger.addPost(createProject);
swagger.addPost(createAssetTag);
swagger.addPost(uploadImage);
swagger.addPatch(updateProjectById);
swagger.addGet(getProjectUsers);
swagger.addPost(createApplication);
swagger.addPost(acceptApplication);
swagger.addPost(createWikiPage);
swagger.addPatch(updateWikiPage);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('projects', {
  description: 'Operations for projects',
  produces: ['application/json']
});
