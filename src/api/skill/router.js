/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');
var partialResponseMiddleware = require('src/middleware/partialResponseMiddleware');

var controller = require('./controller');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var getSkills = {
  spec: {
    path: '/skills',
    summary: 'Get a list of skills',
    method: 'GET',
    parameters: [
      swagger.params.query('name', 'skill name', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string'),
      swagger.params.query('take', 'number of results to take', 'int')
    ],
    nickname: 'getSkills',
    type: 'Skill',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    authMiddleware.authenticationRequired(req, res, function(err) {
      if (err) return next(err);
      partialResponseMiddleware(req, res, function(err) {
        if (err) return next(err);
        controller.getAll(req, res, next);
      });
    });
  }
};

swagger.addGet(getSkills);
/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('skills', {
  description: 'Operations for skills',
  produces: ['application/json']
});
