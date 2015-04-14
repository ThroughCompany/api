process.env.NODE_ENV = 'test';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var mongoose = require('mongoose');
var childProcess = require('child_process');

var app = require('src');
var appConfig = require('src/config/app-config');
var mongoConfig = require('src/config/mongo-config');

var agent = require('tests/lib/agent');

var dbSeed = require('tools/db-seed');

/* =========================================================================
 * Before
 * ========================================================================= */
before(function(next) {
  console.log('\n--------------------------------------------\nRUNNING TEST SETUP...\n--------------------------------------------');

  next();
});

before(function(next) {
  console.log('\nCLEANING MONGO DB...');

  var dbClean = childProcess.fork('tools/scripts/db-clean');

  dbClean.on('close', function(code) {
    console.log('\nFINISHED CLEANING MONGO DB...');
    next();
  });
});

before(function(next) {
  console.log('\nLOADING SEED DATA...');

  var dbSeed = childProcess.fork('tools/scripts/db-seed', ['--createAdmins', 'false']);

  dbSeed.on('close', function(code) {
    console.log('\nFINISHED LOADING SEED DATA...');
    next();
  });
});

before(function(next) {
  app.init({
    http: true
  }, next);
});

before(function(next) {
  var httpConfig = require('src/config/http-config');

  httpConfig.init(function(err, expressConfig) {
    console.log('\nSTARTING TEST AGENT...');

    agent.init(expressConfig.app);

    console.log('TEST AGENT STARTED...');
    next();
  });
});

before(function(next) {
  console.log('\n--------------------------------------------\nFINISHED RUNNING TEST SETUP\n--------------------------------------------');

  next();
});

after(function(next) {
  console.log('\n--------------------------------------------\nCLEANUP TEST SETUP\n--------------------------------------------');

  mongoConfig.disconnect();

  next();
});
