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
      swagger.params.path('id', 'project\'s id', 'string')
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
      authMiddleware.currentUserProjectIdParamRequired('id')(req, res, function(err) {
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
      authMiddleware.currentUserProjectIdParamRequired('id')(req, res, function(err) {
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
      authMiddleware.currentUserProjectIdParamRequired('id')(req, res, function(err) {
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

swagger.addGet(getProjects);
swagger.addGet(getProjectById);
swagger.addPost(createProject);
swagger.addPost(createAssetTag);
swagger.addPost(uploadImage);
swagger.addPatch(updateProjectById);
swagger.addGet(getProjectUsers);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('projects', {
  description: 'Operations for projects',
  produces: ['application/json']
});
