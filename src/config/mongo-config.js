'use strict';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');

var appConfig = require('src/config/app-config');

var logger = require('modules/logger');

var dbOptions = {
  server: {
    socketOptions: {
      keepAlive: 1 //keep the connection open even if inactive
    }
  }
};

/* =========================================================================
 * Init
 * ========================================================================= */
var dbConnection;

function init(next, forceReConnect) {
  if (dbConnection && !forceReConnect) return next(null, dbConnection); //if db connection has already been initialized, just return it

  mongoose.connect(appConfig.db, dbOptions);

  dbConnection = mongoose.connection;

  dbConnection.on('open', function(err) {
    if (!err) logger.info('Connected to MongoDb @ ' + appConfig.db);

    next(err, dbConnection);
  });

  dbConnection.on('disconnected', function() {
    logger.error('Mongo Database disconnected');
  });

  dbConnection.on('error', function(err) {
    logger.error('Mongo Error:');
    logger.error(err);
  });
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = {
  init: init
};
