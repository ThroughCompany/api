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
 * Constants
 * ========================================================================= */
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var getNeeds = {
  spec: {
    path: '/needs',
    summary: 'Get a list of needs',
    method: 'GET',
    parameters: [
      swagger.params.query('status', 'need status', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string'),
      swagger.params.query('sort', 'sort by', 'string'),
      swagger.params.query('limit', 'limit', 'number')
    ],
    nickname: 'getNeeds',
    type: 'Need',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    partialResponseMiddleware(req, res, function(err) {
      if (err) return next(err);
      controller.getNeeds(req, res, next);
    });
  }
};

var getNeedById = {
  spec: {
    path: '/needs/{id}',
    summary: 'Get a need by id',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'need\'s id', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string')
    ],
    nickname: 'getNeedById',
    type: 'Need',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getNeedById(req, res, next);
  }
};

var createNeed = {
  spec: {
    path: '/needs',
    summary: 'Create a new need',
    method: 'POST',
    parameters: [
      swagger.params.body('organizationId', 'organization\'s id', 'string'),
      swagger.params.body('userId', 'user\'s id', 'string'),
      swagger.params.body('projectId', 'project\'s id', 'string'),
      swagger.params.body('name', 'need name', 'string'),
      swagger.params.body('description', 'need description', 'string')
    ],
    nickname: 'createNeed',
    type: 'Need',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      //optional organization id
      authMiddleware.currentUserOrganizationIdBodyParamOptional('organizationId')(req, res, function(err) {
        if (err) console.log('FAILED ORG CHECK');
        if (err) return next(err);
        //optional user id
        authMiddleware.currentUserIdBodyParamOptional('userId')(req, res, function(err) {
          if (err) console.log('FAILED USER CHECK');
          if (err) return next(err);
          //optional project id
          authMiddleware.currentUserProjectIdBodyParamOptional('projectId')(req, res, function(err) {
            if (err) console.log('FAILED PROJECT CHECK');
            if (err) return next(err);
            controller.createNeed(req, res, next);
          });
        });
      });
    });
  }
};

var updateNeedById = {
  spec: {
    path: '/needs/{id}',
    summary: 'Update a need',
    method: 'PATCH',
    parameters: [
      swagger.params.path('id', 'need\'s id', 'string'),
      swagger.params.body('organizationId', 'organization\'s id', 'string'),
      swagger.params.body('userId', 'user\'s id', 'string'),
      swagger.params.body('projectId', 'project\'s id', 'string')
    ],
    nickname: 'updateNeedById',
    type: 'Need',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      //optional organization id
      authMiddleware.currentUserOrganizationIdBodyParamOptional('organizationId')(req, res, function(err) {
        if (err) console.log('FAILED ORG CHECK');
        if (err) return next(err);
        //optional user id
        authMiddleware.currentUserIdBodyParamOptional('userId')(req, res, function(err) {
          if (err) console.log('FAILED USER CHECK');
          if (err) return next(err);
          //optional project id
          authMiddleware.currentUserProjectIdBodyParamOptional('projectId')(req, res, function(err) {
            if (err) console.log('FAILED PROJECT CHECK');
            if (err) return next(err);
            controller.updateNeedById(req, res, next);
          });
        });
      });
    });
  }
};

swagger.addGet(getNeeds);
swagger.addGet(getNeedById);
swagger.addPost(createNeed);
swagger.addPatch(updateNeedById);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('needs', {
  description: 'Operations for needs',
  produces: ['application/json']
});
