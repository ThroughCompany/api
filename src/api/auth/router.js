/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');

var controller = require('./controller');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var authenticateWithCredentials = {
  spec: {
    path: '/auth/credentials',
    summary: 'Authenticate using email and password',
    method: 'POST',
    parameters: [
      swagger.params.body('auth', 'user\s auth info - (email, password)', 'string')
    ],
    type: 'User',
    nickname: 'authenticateWithCredentials',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.authenticateWithCredentials(req, res, next);
  }
};

var authenticateWithFacebook = {
  spec: {
    path: '/auth/facebook',
    summary: 'Authenticate using Facebook',
    method: 'POST',
    parameters: [
      swagger.params.body('auth', 'user\s auth info - (facebook access token)', 'string')
    ],
    type: 'User',
    nickname: 'authenticateWithFacebook',
    produces: ['application/json'],
  },
  action: function(req, res, next) {
    controller.authenticateWithFacebook(req, res, next);
  }
};

swagger.addPost(authenticateWithCredentials);
swagger.addPost(authenticateWithFacebook);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('auth', {
  description: 'Operations for authenticating users',
  produces: ['application/json']
});
