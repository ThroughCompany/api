/* =========================================================================
 * Dependencies
 * ========================================================================= */
var swagger = require('swagger-node-express');

var controller = require('./controller');

/* =========================================================================
 * Swagger specs
 * ========================================================================= */
var ping = {
  spec: {
    path: '/ping',
    summary: 'Ping server to get it\'s status',
    method: 'GET',
    type: 'Ping',
    nickname: 'ping',
    produces: ['application/json']
  },
  action: function(req, res, next) {
    controller.ping(req, res, next);
  }
};

swagger.addGet(ping);

/* =========================================================================
 *   Swagger declarations
 * ========================================================================= */
swagger.configureDeclaration('ping', {
  description: 'Operations for pinging the server',
  produces: ['application/json']
});
