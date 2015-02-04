"use strict";

/* =========================================================================
 *
 *   Dependencies
 *
 * ========================================================================= */
var winston = require('winston');

var appConfig = require('src/config/app-config');

var logger = function() {
  var transports = [];

  // createFullPath(logConfig.location);

  // file logging
  // var fileTransport = new (winston.transports.File)({
  //   filename: logConfig.location,
  //   level: logConfig.level,
  //   colorize: true
  // });
  // // always log to file
  // transports.push(fileTransport);

  // if console enabled also log to console
  var consoleTransport = new(winston.transports.Console)({
    level: appConfig.log.level,
    colorize: true
  });
  transports.push(consoleTransport);

  var logger = new(winston.Logger)({
    transports: transports
  });

  return logger;
};

/* =========================================================================
 *
 *   Exports
 *
 * ========================================================================= */
module.exports = new logger();
