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
var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var createInvitation = {
  spec: {
    path: '/invitations',
    summary: 'Create an invitation',
    method: 'POST',
    parameters: [],
    nickname: 'createInvitation',
    type: 'Invitation',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      //optional organization id
      authMiddleware.currentUserOrganizationIdBodyParamOptional('organizationId')(req, res, function(err) {
        if (err) console.log('FAILED ORG CHECK');
        if (err) return next(err);
        authMiddleware.currentUserOrgnizationPermissionBodyParamOptions('organizationId', PERMISSION_NAMES.ADD_ORGANIZATION_USERS)(req, res, function(err) {
          if (err) console.log('FAILED ORG PERMISSION CHECK');
          if (err) return next(err);
          //optional project id
          authMiddleware.currentUserProjectIdBodyParamOptional('projectId')(req, res, function(err) {
            if (err) console.log('FAILED PROJECT CHECK');
            if (err) return next(err);
            authMiddleware.currentUserProjectPermissionBodyParamOptions('projectId', PERMISSION_NAMES.ADD_PROJECT_USERS)(req, res, function(err) {
              if (err) console.log('FAILED PROJECT PERMISSION CHECK');
              if (err) return next(err);
              controller.createInvitation(req, res, next);
            });
          });
        });
      });
    });
  }
};

swagger.addPost(createInvitation);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('invitations', {
  description: 'Operations for invitations',
  produces: ['application/json']
});
