/* =========================================================================
 * Dependencies
 * ========================================================================= */
var appConfig = require('src/config/app-config');
var logger = require('modules/logger');
var px = require('6px');

/* =========================================================================
 * Init Express
 * ========================================================================= */
var expressConfig;

function init(next) {
  logger.info('Configuring PX...');

  // px.on('connection', function() {
  //   logger.info('Connected to PX');

  //   //next();
  // });

  // px({
  //   userId: appConfig.px.userId,
  //   apiKey: appConfig.px.apiKey,
  //   apiSecret: appConfig.px.apiSecret
  // });

  next();
}

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = {
  init: init
};
