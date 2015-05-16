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

var uploadImage = {
  spec: {
    path: '/organizations/{id}/images',
    summary: 'Upload an organization image',
    method: 'POST',
    parameters: [
      swagger.params.path('id', 'organization\'s id', 'string')
    ],
    nickname: 'uploadImage',
    type: 'Organization',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserOrganizationIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        multipartMiddleware(req, res, function(err) {
          if (err) return next(err);
          controller.uploadImage(req, res, next);
        });
      });
    });
  }
};

// ------- Organization Applications ------- //
var getOrganizationApplications = {
  spec: {
    path: '/organizations/{id}/applications',
    summary: 'Get a organization\'s applications',
    method: 'GET',
    parameters: [
      swagger.params.path('id', 'organization\'s id', 'string')
    ],
    nickname: 'getOrganizationApplications',
    type: 'Application',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      authMiddleware.currentUserOrganizationIdQueryParamRequired('id')(req, res, function(err) {
        if (err) return next(err);
        controller.getOrganizationApplications(req, res, next);
      });
    });
  }
};

swagger.addGet(getOrganizationById);
swagger.addPost(createOrganization);
swagger.addGet(getOrganizationApplications);
swagger.addPost(uploadImage);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('organizations', {
  description: 'Operations for organizations',
  produces: ['application/json']
});
