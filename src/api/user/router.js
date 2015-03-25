/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');
var multipart = require('connect-multiparty');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');
var partialResponseMiddleware = require('src/middleware/partialResponseMiddleware');
var multipartMiddleware = multipart();

var controller = require('./controller');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var getUsers = {
  spec: {
    path: '/users',
    summary: 'Get a list of users',
    method: 'GET',
    parameters: [
      swagger.params.query('fields', 'csv of fields to select', 'string'),
      swagger.params.query('take', 'number of results to take', 'int')
    ],
    nickname: 'getUsers',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.adminRequired(req, res, function(err) {
        if (err) return next(err);
        partialResponseMiddleware(req, res, function(err) {
          if (err) return next(err);
          controller.getUsers(req, res, next);
        });
      });
    });
  }
};

var getUserById = {
  spec: {
    path: '/users/{id}',
    summary: 'Get a user by id',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'user\s id', 'string')
    ],
    nickname: 'getUserById',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getUserById(req, res, next);
  }
};

var getUserClaimsById = {
  spec: {
    path: '/users/{id}/claims',
    summary: 'Get a user\'s claims by id',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'user\'s id', 'string')
    ],
    nickname: 'getUserClaimsById',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.getUserClaimsById(req, res, next);
      });
    });
  }
};

var createUser = {
  spec: {
    path: '/users',
    summary: 'Create a new user',
    method: 'POST',
    parameters: [
      swagger.params.body('auth', 'user\'s info (email, password)', 'string')
    ],
    nickname: 'createUser',
    type: 'User',
    consumes: ['application/json'],
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.createUser(req, res, next);
  }
};

var getUserProjectsById = {
  spec: {
    path: '/users/{id}/projects',
    summary: 'Get a user\'s project by id',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'user\'s id', 'string')
    ],
    nickname: 'getUserProjectsById',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getUserProjectsById(req, res, next);
  }
};

var updateUserById = {
  spec: {
    path: '/users/{id}',
    summary: 'Update a user by id',
    method: 'PATCH',
    parameters: [
      swagger.params.path('id', 'user\s id', 'string')
    ],
    nickname: 'updateUserById',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.updateUserById(req, res, next);
      });
    });
  }
};

var uploadImage = {
  spec: {
    path: '/users/{id}/images',
    summary: 'Upload a user image',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'user\'s id', 'string')
    ],
    nickname: 'uploadImage',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        multipartMiddleware(req, res, function(err) {
          if (err) return next(err);
          controller.uploadImage(req, res, next);
        });
      });
    });
  }
};

var createAssetTag = {
  spec: {
    path: '/users/{id}/assettags',
    summary: 'Add user asset tag',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'user\'s id', 'string'),
      swagger.params.body('tags', 'asset tag', 'string')
    ],
    nickname: 'createAssetTag',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.createAssetTag(req, res, next);
      });
    });
  }
};

swagger.addGet(getUsers);
swagger.addGet(getUserById);
swagger.addGet(getUserClaimsById);
swagger.addPost(createUser);
swagger.addGet(getUserProjectsById);
swagger.addPatch(updateUserById);
swagger.addPost(uploadImage);
swagger.addPost(createAssetTag);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('users', {
  description: 'Operations for users',
  produces: ['application/json']
});
