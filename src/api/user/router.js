/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');

var controller = require('./controller');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var getUsers = {
  spec: {
    path: '/users',
    summary: 'Get a list of users',
    method: 'GET',
    nickname: 'getUsers',
    type: 'User',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.adminRequired(req, res, function(err) {
        if (err) return next(err);
        controller.getUsers(req, res, next);
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
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.getUserById(req, res, next);
      });
    });
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
      authMiddleware.currentUserIdParamRequired('id')(req, res, function(err) {
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
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserIdParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.getUserProjectsById(req, res, next);
      });
    });
  }
};

swagger.addGet(getUsers);
swagger.addGet(getUserById);
swagger.addGet(getUserClaimsById);
swagger.addPost(createUser);
swagger.addGet(getUserProjectsById);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('users', {
  description: 'Operations for users',
  produces: ['application/json']
});
