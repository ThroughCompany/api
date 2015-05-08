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
var getSkills = {
  spec: {
    path: '/skills',
    summary: 'Get a list of skills',
    method: 'GET',
    parameters: [
      swagger.params.query('name', 'skill name', 'string'),
      swagger.params.query('needId', 'need id', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string'),
      swagger.params.query('take', 'number of results to take', 'int')
    ],
    nickname: 'getSkills',
    type: 'Skill',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.getAll(req, res, next);
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
