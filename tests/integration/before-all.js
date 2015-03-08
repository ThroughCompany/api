process.env.NODE_ENV = 'test';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var mongoose = require('mongoose');

var app = require('src');
var appConfig = require('src/config/app-config');

var agent = require('tests/lib/agent');

var dbSeed = require('tools/db-seed');
var dbClean = require('tools/db-clean');

/* =========================================================================
 * Before
 * ========================================================================= */
before(function(next) {
  console.log('\n--------------------------------------------\nRUNNING TEST SETUP...\n--------------------------------------------');

  next();
});

before(function(next) {
  console.log('\nDROPPING MONGO DB...');

  dbClean.run({}, next);
});

before(function(next) {
  console.log('\nLOADING SEED DATA...');

  dbSeed.run({
    createAdmins: false
  }, function() {

    console.log('SEED DATA LOADED');
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
