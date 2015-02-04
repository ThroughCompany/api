'use strict';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var http = require('http');
var path = require('path');
var express = require('express');
var swagger = require('swagger-node-express');
var expressValidator = require('express-validator');
var compress = require('compression');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');
var responseTime = require('response-time');
var cors = require('cors');
var fs = require('fs');
var _ = require('underscore');

var appConfig = require('src/config/app-config');

var errors = require('modules/error/errors');
var logger = require('modules/logger');

var error = require('modules/error'); //middleware

/* =========================================================================
 * Init Express
 * ========================================================================= */
var expressConfig;

function init(next) {
  if (expressConfig) return next(null, expressConfig);
  next = next || function() {};

  var app = express();

  if (appConfig.ENV_PROD) {
    app.set('json spaces', 0); //remove any whitespace from JSON, minimize response sizes

    app.use(forceSSL);
  } else {
    app.set('json spaces', 2); //make JSON more readable
    app.set('showStackError', true);
  }

  configureSwagger(app);

  app.use(cors());
  app.use(compress()); //GZIP compression
  app.use(bodyParser.json()); //parse application/json
  app.use(bodyParser.urlencoded({ // parse application/x-www-form-urlencoded
   extended: true
  }));
  app.use(expressValidator());
  app.use(logParams);
  app.use(defaultHeaders);

  if (process.env.BENCHMARK) {
    console.log('-------------- BENCHMARKING ENABLED --------------');
    app.use(benchmark());
  }

  logger.info('loading controllers and routes');

  loadRoutes(app);

  swagger.configureSwaggerPaths('', '/api-docs', '');
  swagger.configure('/', appConfig.version);

  // assume 404 since no middleware responded
  app.use(function(req, res, next) {
    return next(new errors.ObjectNotFoundError('path: ' + req.url + ' not found'));
  });

  app.use(error);

  var httpServer = app.listen(appConfig.port, function() {
    logger.info('http server listening @: ' + appConfig.port);

    expressConfig = {
      httpServer: httpServer,
      app: app
    };

    next(null, expressConfig);
  });
}

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function loadRoutes(app) {
  console.log('\nConfiguring routes...\n');

  app.get('/', function(req, res) {
    var data = {
      name: 'through company ' + appConfig.ENV + ' API',
      version: appConfig.apiVersion
    };

    if (appConfig.ENV_DEV) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      data.docs = fullUrl + 'docs';
    }

    res.status(200).json(data);
  });

  var files = fs.readdirSync('src/api');

  _.each(files, function(file) {
    console.log('Routes found for ' + file);

    require('src/api/' + file);
  });
}

function configureSwagger(app) {
  swagger.setAppHandler(app);
  swagger.setApiInfo({
    title: appConfig.app.name,
    contact: appConfig.app.systemEmail
  });
  // swagger.configureSwaggerPaths('', '/api-docs', '');
  // swagger.configure('/', appConfig.version);

  if (appConfig.ENV_DEV || appConfig.ENV_TEST) {
    app.locals.pretty = true;

    app.use('/docs', express.static(path.join(__dirname, '../../docs/swagger')));
  }
}

/* =========================================================================
 * Middleware
 * ========================================================================= */
function defaultHeaders(req, res, next) {
  res.header("Content-Type", "application/json; charset=UTF-8");
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  next();
}

function forceSSL(req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect(301, 'https://' + req.get('host') + req.url);
  } else {
    res.header("Strict-Transport-Security", "max-age=31536000");
    next();
  }
}

function logParams(req, res, next) {
  // ignore /status pings
  var logPath = ((req.url.indexOf('/status') === -1) && (req.url.indexOf('/heartbeat') === -1));
  if (logPath) {
    logger.debug(req.method + " " + req.url);
  }

  // paths where body should not be logged
  var ignoreBodyPaths = [
    // '/auth/login',
    // '/auth/register',
    // '/paymentProfile',
  ];

  var logBody = req.body;
  ignoreBodyPaths.forEach(function(path) {
    logBody = logBody && (req.url.indexOf(path) === -1);
  });

  // don't log body on a GET
  if (req.method === 'GET') logBody = false;

  if (logPath && logBody) {
    logger.debug('Body: ' + JSON.stringify(req.body));
  }

  next();
}

function benchmark() {
  var _responseTime = responseTime({
    digits: 0,
    suffix: false
  });
  return function(req, res) {
    res.on('finish', function() {
      var time = parseFloat(res.get('x-response-time'));
      var status = '';
      if (time < 199) {
        status = 'BENCHMARK-GOOD';
      }
      if (time >= 200 && time < 499) {
        status = 'BENCHMARK-OK';
      }
      if (time >= 500 && time < 999) {
        status = 'BENCHMARK-SLOW';
      }
      if (time >= 1000) {
        status = 'BENCHMARK-BAD';
      }
      logger.info(util.format('%s %dms %s %s', status, time, req.method, req.originalUrl));
    });
    _responseTime.apply(this, arguments);
  };
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = {
  init: init
}
