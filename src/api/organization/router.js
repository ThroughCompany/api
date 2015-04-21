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
var createOrganization = {
  spec: {
    path: '/organizations',
    summary: 'Create an organization',
    method: 'POST',
    parameters: [
      swagger.params.body('organization', 'organization info', 'string')
    ],
    nickname: 'createOrganization',
    type: 'Organization',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      controller.createOrganization(req, res, next);
    });
  }
};

swagger.addPost(createOrganization);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('organizations', {
  description: 'Operations for organizations',
  produces: ['application/json']
});
