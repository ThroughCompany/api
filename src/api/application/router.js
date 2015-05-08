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

// var updateApplication = {
//   spec: {
//     path: '/applications/{id}',
//     summary: 'Update an application',
//     method: 'PATCH',
//     parameters: [
//       swagger.params.path('id', 'application\'s id', 'string')
//     ],
//     nickname: 'updateApplication',
//     type: 'Application',
//     produces: ['application/json']
//   },
//   action: function(req, res, next) {
//     authMiddleware.authenticationRequired(req, res, function(err) {
//       if (err) return next(err);
//       //TODO: replace this will middleware that checks for optional org id, user id, or project id
//       authMiddleware.currentUserProjectIdQueryParamRequired('id')(req, res, function(err) {
//         if (err) return next(err);
//         controller.updateApplicationById(req, res, next);
//       });
//     });
//   }
// };

swagger.addPost(createApplication);
//swagger.addPatch(updateApplication);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('applications', {
  description: 'Operations for applications',
  produces: ['application/json']
});
