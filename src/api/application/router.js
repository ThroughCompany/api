/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');

var controller = require('./controller');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var createApplication = {
  spec: {
    path: '/applications',
    summary: 'Create an application',
    method: 'POST',
    parameters: [
      swagger.params.body('createdByUserId', 'user\'s id', 'string')
    ],
    nickname: 'createApplication',
    type: 'Application',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      controller.createApplication(req, res, next);
    });
  }
};

var updateApplication = {
  spec: {
    path: '/applications/{id}',
    summary: 'Update an application',
    method: 'PATCH',
    parameters: [
      swagger.params.path('id', 'application\'s id', 'string')
    ],
    nickname: 'updateApplication',
    type: 'Application',
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
            controller.updateApplicationById(req, res, next);
          });
        });
      });
    });
  }
};

swagger.addPost(createApplication);
swagger.addPatch(updateApplication);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('applications', {
  description: 'Operations for applications',
  produces: ['application/json']
});
