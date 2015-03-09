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
var getAssetTags = {
  spec: {
    path: '/assettags',
    summary: 'Get a list of asset tags',
    method: 'GET',
    parameters: [
      swagger.params.query('name', 'asset tag name', 'string'),
      swagger.params.query('fields', 'csv of fields to select', 'string'),
      swagger.params.query('take', 'number of results to take', 'int')
    ],
    nickname: 'getAssetTags',
    type: 'Asset-Tags',
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

swagger.addGet(getAssetTags);
/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('asset-tags', {
  description: 'Operations for asset tags',
  produces: ['application/json']
});
