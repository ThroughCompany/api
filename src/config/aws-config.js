/* =========================================================================
 * Dependencies
 * ========================================================================= */
var appConfig = require('src/config/app-config');
var logger = require('modules/logger');
var AWS = require('aws-sdk');


/* =========================================================================
 * Init Express
 * ========================================================================= */
var expressConfig;

function init(next) {
  logger.info('Configuring AWS...');

  AWS.config.update({
    accessKeyId: appConfig.aws.accessKeyId,
    secretAccessKey: appConfig.aws.secretAccessKey,
    region: appConfig.aws.region
  });

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
