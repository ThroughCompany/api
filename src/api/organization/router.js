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
var getOrganizationById = {
  spec: {
    path: '/organizations/{id}',
    summary: 'Get an organization by id',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'organization\'s id', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string')
    ],
    nickname: 'getOrganizationById',
    type: 'Project',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getOrganizationById(req, res, next);
  }
};

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

var createOrganizationProject = {
  spec: {
    path: '/organizations/{id}/projects',
    summary: 'Create an organization project',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'organization\'s id', 'string'),
      swagger.params.body('project', 'project info', 'string')
    ],
    nickname: 'createOrganizationProject',
    type: 'OrganizationProject',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserOrganizationIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.createOrganizationProject(req, res, next);
      });
    });
  }
};

swagger.addGet(getOrganizationById);
swagger.addPost(createOrganization);
swagger.addPost(createOrganizationProject);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('organizations', {
  description: 'Operations for organizations',
  produces: ['application/json']
});
