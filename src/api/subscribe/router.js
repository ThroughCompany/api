/* =========================================================================
 * Dependencies
 * ========================================================================= */
var express = require('express');
var swagger = require('swagger-node-express');
var multipart = require('connect-multiparty');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');
var partialResponseMiddleware = require('src/middleware/partialResponseMiddleware');
var multipartMiddleware = multipart();

var controller = require('./controller');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var subscribe = {
  spec: {
    path: '/subscribe',
    summary: 'Subscribe',
    method: 'POST',
    parameters: [],
    nickname: 'subscribe',
    type: 'Subscribe',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.subscribe(req, res, next);
  }
};

swagger.addPost(subscribe);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */

swagger.configureDeclaration('subscribe', {
  description: 'Operations for subcribing',
  produces: ['application/json']
});
